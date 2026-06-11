import { logger, task } from "@trigger.dev/sdk";
import { generateEmbeddings } from "@/lib/ai/embedding";
import { extractRawText, sanitizeData } from "@/lib/ai/extract-web-page";
import { extractTextFromPdfUrl } from "@/lib/ai/mistral-ocr";
import {
	deleteKnowledgeEmbeddingsByKnowledgeId,
	getKnowledgeByIdAndUserId,
	insertKnowledgeEmbeddings,
	markKnowledgeFailed,
	markKnowledgeProcessing,
	markKnowledgeReady,
} from "@/lib/db/queries/knowledge";
import { logStream } from "./streams";

const SUMMARY_LIMIT = 500;
const MAX_ERROR_LENGTH = 500;

type KnowledgePayload = {
	knowledgeId: string;
	userId: string;
};

type EmbeddingPayload = Array<{ embedding: number[]; content: string }>;

type KnowledgeTaskOutput = {
	status: "ready" | "failed";
	knowledgeId: string;
};

const normalizeText = (value: string) =>
	value
		.replace(/\r\n/g, "\n")
		.replace(/[ \t]+\n/g, "\n")
		.replace(/\n{3,}/g, "\n\n")
		.replace(/[ \t]{2,}/g, " ")
		.trim();

const buildSummary = (value: string) => {
	if (value.length <= SUMMARY_LIMIT) {
		return value;
	}

	return `${value.slice(0, SUMMARY_LIMIT)}...`;
};

const getErrorMessage = (error: unknown) => {
	if (error instanceof Error) {
		return error.message.slice(0, MAX_ERROR_LENGTH);
	}

	return "Unknown error";
};

const failKnowledge = async ({
	knowledgeId,
	userId,
	message,
}: KnowledgePayload & {
	message: string;
}): Promise<KnowledgeTaskOutput> => {
	logger.error(message, { knowledgeId, userId });
	await logStream.append(message);
	await markKnowledgeFailed({
		knowledgeId,
		userId,
		errorMessage: message,
	});

	return { status: "failed", knowledgeId };
};

export const processKnowledgeTask = task<
	"process-knowledge",
	KnowledgePayload,
	KnowledgeTaskOutput
>({
	id: "process-knowledge",
	maxDuration: 3600,
	run: async (payload, { ctx }) => {
		logger.log("Starting knowledge processing workflow", { payload, ctx });
		await logStream.append("Loading...");

		const record = await getKnowledgeByIdAndUserId({
			knowledgeId: payload.knowledgeId,
			userId: payload.userId,
		});

		if (!record) {
			return await failKnowledge({
				...payload,
				message: "Knowledge record not found",
			});
		}

		if (record.status === "ready") {
			await logStream.append("Knowledge is already ready.");
			return { status: "ready", knowledgeId: record.id };
		}

		if (
			record.knowledgeType !== "webpage" &&
			record.knowledgeType !== "pdf"
		) {
			return await failKnowledge({
				...payload,
				message: "Unsupported knowledge type",
			});
		}

		const processingRecord = await markKnowledgeProcessing({
			knowledgeId: payload.knowledgeId,
			userId: payload.userId,
		});

		if (!processingRecord) {
			return await failKnowledge({
				...payload,
				message: "Knowledge record not found",
			});
		}

		logger.log("Knowledge record found", { payload, ctx });

		let rawText = "";
		if (record.knowledgeType === "webpage") {
			const url = record.sourceUrl ?? record.knowledgeName;
			if (!url) {
				return await failKnowledge({
					...payload,
					message: "No URL found for webpage knowledge",
				});
			}

			logger.log("Processing Webpage...", { payload, ctx, url });
			await logStream.append("Processing Webpage...");

			const { success, result } = await extractRawText({ url });
			if (!(success && result?.length)) {
				return await failKnowledge({
					...payload,
					message: "Failed to extract content from URL",
				});
			}

			const rawContent = result[0]?.rawContent ?? "";
			if (!rawContent) {
				return await failKnowledge({
					...payload,
					message: "No content extracted from URL",
				});
			}

			await logStream.append("Sanitizing...");
			const { success: sanitizedSuccess, sanitizedText } =
				await sanitizeData({ rawText: rawContent });
			if (!(sanitizedSuccess && sanitizedText)) {
				return await failKnowledge({
					...payload,
					message: "Failed to sanitize extracted content",
				});
			}

			rawText = sanitizedText;
		} else {
			if (!record.sourceUrl) {
				return await failKnowledge({
					...payload,
					message: "Knowledge record is missing source URL",
				});
			}

			logger.log("Processing PDF", {
				payload,
				ctx,
				url: record.sourceUrl,
			});
			await logStream.append("Processing PDF...");

			const textFromPdf = await extractTextFromPdfUrl(record.sourceUrl);
			if (!textFromPdf) {
				return await failKnowledge({
					...payload,
					message: "Failed to extract text from PDF",
				});
			}

			rawText = textFromPdf;
		}

		const normalizedText = normalizeText(rawText);
		if (!normalizedText) {
			return await failKnowledge({
				...payload,
				message: "No extractable text found",
			});
		}

		logger.log("Knowledge Processed", { payload, ctx });
		await logStream.append("Embedding...");

		const embeddings = (await generateEmbeddings(
			normalizedText
		)) as EmbeddingPayload;
		if (!embeddings.length) {
			return await failKnowledge({
				...payload,
				message: "Failed to generate embeddings",
			});
		}

		await logStream.append("Saving...");
		await deleteKnowledgeEmbeddingsByKnowledgeId({
			knowledgeId: payload.knowledgeId,
		});
		await insertKnowledgeEmbeddings({
			knowledgeId: payload.knowledgeId,
			createdAt: new Date(),
			embeddings,
		});

		await markKnowledgeReady({
			knowledgeId: payload.knowledgeId,
			userId: payload.userId,
			knowledgeSummary: buildSummary(normalizedText),
		});

		await logStream.append("Done.");
		return { status: "ready", knowledgeId: payload.knowledgeId };
	},
});
