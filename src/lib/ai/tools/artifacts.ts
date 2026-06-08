import type { LanguageModel, UIMessageStreamWriter } from "ai";
import { tool } from "ai";
import { z } from "zod";
import {
	createTextArtifactPrompt,
	streamTextArtifact,
	updateTextArtifactPrompt,
	writeArtifactData,
} from "@/artifacts/text/server";
import {
	appendArtifactVersion,
	assertArtifactBelongsToChat,
	createArtifact,
	getLatestArtifactVersion,
} from "@/lib/db/queries/artifacts";
import type { ChatMessage } from "../types";

const MAX_ARTIFACT_CONTENT_LENGTH = 250_000;

const assertContentWithinLimit = (content: string) => {
	if (content.length > MAX_ARTIFACT_CONTENT_LENGTH) {
		throw new Error("Artifact content is too large to save");
	}
};

export const createTextArtifactTool = ({
	userId,
	chatId,
	model,
	dataStream,
}: {
	userId: string;
	chatId: string;
	model: LanguageModel;
	dataStream: UIMessageStreamWriter<ChatMessage>;
}) =>
	tool({
		description:
			"Create a persistent markdown text artifact for long-form drafts, documents, plans, specs, essays, or emails.",
		inputSchema: z.object({
			title: z.string().min(1).max(120),
			instructions: z.string().min(1).max(8000),
		}),
		execute: async ({ title, instructions }, { toolCallId }) => {
			const createdArtifact = await createArtifact({
				userId,
				chatId,
				title,
				kind: "text",
			});

			writeArtifactData(dataStream, {
				event: "open",
				artifactId: createdArtifact.id,
				chatId,
				kind: "text",
				title,
				content: "",
				status: "streaming",
			});

			try {
				const content = await streamTextArtifact({
					model,
					prompt: createTextArtifactPrompt({
						title,
						instructions,
					}),
					onDelta: (delta) => {
						writeArtifactData(dataStream, {
							event: "delta",
							artifactId: createdArtifact.id,
							delta,
						});
					},
				});

				assertContentWithinLimit(content);

				const version = await appendArtifactVersion({
					artifactId: createdArtifact.id,
					userId,
					content,
					source: "assistant",
				});

				writeArtifactData(dataStream, {
					event: "finish",
					artifactId: createdArtifact.id,
					versionId: version.id,
					versionNumber: version.versionNumber,
					content,
				});

				return {
					artifactId: createdArtifact.id,
					kind: "text" as const,
					title,
					versionNumber: version.versionNumber,
					toolCallId,
				};
			} catch (error) {
				writeArtifactData(dataStream, {
					event: "error",
					artifactId: createdArtifact.id,
					message:
						error instanceof Error
							? error.message
							: "Failed to create artifact",
				});
				throw error;
			}
		},
	});

export const updateTextArtifactTool = ({
	userId,
	chatId,
	model,
	dataStream,
	activeArtifactId,
}: {
	userId: string;
	chatId: string;
	model: LanguageModel;
	dataStream: UIMessageStreamWriter<ChatMessage>;
	activeArtifactId?: string;
}) =>
	tool({
		description:
			"Update the currently open or explicitly selected markdown text artifact.",
		inputSchema: z.object({
			artifactId: z.string().uuid().optional(),
			instructions: z.string().min(1).max(8000),
		}),
		execute: async ({ artifactId, instructions }, { toolCallId }) => {
			const targetArtifactId = artifactId ?? activeArtifactId;
			if (!targetArtifactId) {
				throw new Error("No open artifact is available to update");
			}

			const selectedArtifact = await assertArtifactBelongsToChat({
				artifactId: targetArtifactId,
				chatId,
				userId,
			});

			const latestVersion = await getLatestArtifactVersion({
				artifactId: selectedArtifact.id,
				userId,
			});

			if (!latestVersion) {
				throw new Error("Artifact has no saved content to update");
			}

			writeArtifactData(dataStream, {
				event: "open",
				artifactId: selectedArtifact.id,
				chatId,
				kind: "text",
				title: selectedArtifact.title,
				versionNumber: latestVersion.versionNumber,
				content: latestVersion.content,
				status: "streaming",
			});

			try {
				const content = await streamTextArtifact({
					model,
					prompt: updateTextArtifactPrompt({
						currentContent: latestVersion.content,
						instructions,
					}),
					onDelta: (delta) => {
						writeArtifactData(dataStream, {
							event: "delta",
							artifactId: selectedArtifact.id,
							delta,
						});
					},
				});

				assertContentWithinLimit(content);

				const version = await appendArtifactVersion({
					artifactId: selectedArtifact.id,
					userId,
					content,
					source: "assistant",
				});

				writeArtifactData(dataStream, {
					event: "finish",
					artifactId: selectedArtifact.id,
					versionId: version.id,
					versionNumber: version.versionNumber,
					content,
				});

				return {
					artifactId: selectedArtifact.id,
					kind: "text" as const,
					title: selectedArtifact.title,
					versionNumber: version.versionNumber,
					toolCallId,
				};
			} catch (error) {
				writeArtifactData(dataStream, {
					event: "error",
					artifactId: selectedArtifact.id,
					message:
						error instanceof Error
							? error.message
							: "Failed to update artifact",
				});
				throw error;
			}
		},
	});
