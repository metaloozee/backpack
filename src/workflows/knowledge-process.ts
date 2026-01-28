import { FatalError } from "workflow";
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
} from "@/lib/db/queries";

const SUMMARY_LIMIT = 500;
const MAX_ERROR_LENGTH = 500;

interface WorkflowInput {
	knowledgeId: string;
	userId: string;
}

interface KnowledgeRecord {
	id: string;
	spaceId: string;
	knowledgeType: "webpage" | "pdf";
	knowledgeName: string;
	sourceUrl: string | null;
	status: "pending" | "processing" | "ready" | "failed";
}

type EmbeddingPayload = Array<{ embedding: number[]; content: string }>;

export async function processKnowledgeWorkflow(input: WorkflowInput) {
	"use workflow";

	const record = await loadKnowledge(input);
	if (record.status === "ready") {
		return { status: "ready" as const };
	}

	await markProcessing(input);

	try {
		const rawText = await loadKnowledgeContent(record);
		const normalizedText = normalizeText(rawText);

		if (!normalizedText) {
			throw new FatalError("No extractable text found");
		}

		const embeddings = await createEmbeddings(normalizedText);
		await saveEmbeddings({ knowledgeId: record.id, embeddings });

		await markReady({
			knowledgeId: record.id,
			userId: input.userId,
			knowledgeSummary: buildSummary(normalizedText),
		});

		return { status: "ready" as const };
	} catch (error) {
		await markFailed({
			knowledgeId: record.id,
			userId: input.userId,
			errorMessage: getErrorMessage(error),
		});

		throw error;
	}
}

async function loadKnowledge({ knowledgeId, userId }: WorkflowInput) {
	"use step";

	const record = await getKnowledgeByIdAndUserId({ knowledgeId, userId });

	if (!record) {
		throw new FatalError("Knowledge not found");
	}

	if (record.knowledgeType !== "webpage" && record.knowledgeType !== "pdf") {
		throw new FatalError("Unsupported knowledge type");
	}

	return record as KnowledgeRecord;
}

async function markProcessing({ knowledgeId, userId }: WorkflowInput) {
	"use step";

	const updated = await markKnowledgeProcessing({ knowledgeId, userId });

	if (!updated) {
		throw new FatalError("Knowledge not found");
	}
}

async function loadKnowledgeContent(record: KnowledgeRecord) {
	"use step";

	if (record.knowledgeType === "webpage") {
		const url = record.sourceUrl ?? record.knowledgeName;
		if (!url) {
			throw new FatalError("Missing webpage URL");
		}

		const { success, result } = await extractRawText({ url });
		if (!(success && result?.length)) {
			throw new Error("Failed to extract content from URL");
		}

		const rawContent = result[0]?.rawContent ?? "";
		if (!rawContent) {
			throw new Error("Extracted content was empty");
		}

		const { success: sanitizedSuccess, sanitizedText } = await sanitizeData(
			{
				rawText: rawContent,
			}
		);

		if (!(sanitizedSuccess && sanitizedText)) {
			throw new Error("Failed to sanitize extracted content");
		}

		return sanitizedText;
	}

	if (!record.sourceUrl) {
		throw new FatalError("Missing PDF source URL");
	}

	try {
		return await extractTextFromPdfUrl(record.sourceUrl);
	} catch (error) {
		const message = getErrorMessage(error);
		if (message.toLowerCase().includes("invalid model")) {
			throw new FatalError(message);
		}
		throw error;
	}
}

async function createEmbeddings(input: string) {
	"use step";

	const embeddings = await generateEmbeddings(input);
	if (!embeddings.length) {
		throw new Error("Failed to generate embeddings");
	}

	return embeddings as EmbeddingPayload;
}

async function saveEmbeddings({
	knowledgeId,
	embeddings,
}: {
	knowledgeId: string;
	embeddings: EmbeddingPayload;
}) {
	"use step";

	await deleteKnowledgeEmbeddingsByKnowledgeId({ knowledgeId });

	const createdAt = new Date();

	await insertKnowledgeEmbeddings({ knowledgeId, createdAt, embeddings });
}

async function markReady({
	knowledgeId,
	userId,
	knowledgeSummary,
}: {
	knowledgeId: string;
	userId: string;
	knowledgeSummary: string;
}) {
	"use step";

	const updated = await markKnowledgeReady({
		knowledgeId,
		userId,
		knowledgeSummary,
	});

	if (!updated) {
		throw new FatalError("Knowledge not found");
	}
}

async function markFailed({
	knowledgeId,
	userId,
	errorMessage,
}: {
	knowledgeId: string;
	userId: string;
	errorMessage: string;
}) {
	"use step";

	await markKnowledgeFailed({ knowledgeId, userId, errorMessage });
}

const normalizeText = (value: string) => {
	return value
		.replace(/\r\n/g, "\n")
		.replace(/[ \t]+\n/g, "\n")
		.replace(/\n{3,}/g, "\n\n")
		.replace(/[ \t]{2,}/g, " ")
		.trim();
};

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
