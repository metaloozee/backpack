import type { LanguageModel, UIMessageStreamWriter } from "ai";
import { tool } from "ai";
import { z } from "zod";
import { editTextArtifact } from "@/artifacts/text/edit.server";
import { rewriteTextArtifact } from "@/artifacts/text/rewrite.server";
import {
	createTextArtifactPrompt,
	streamTextArtifact,
	writeArtifactData,
} from "@/artifacts/text/server";
import { MAX_ARTIFACT_CONTENT_LENGTH } from "@/lib/artifacts/types";
import {
	appendArtifactVersion,
	assertArtifactBelongsToChat,
	createArtifact,
	deleteArtifactIfVersionless,
	getLatestArtifactVersion,
} from "@/lib/db/queries/artifacts";
import type { ChatMessage } from "../types";

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
				operation: "create",
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
							target: "create-preview",
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
				try {
					await deleteArtifactIfVersionless({
						artifactId: createdArtifact.id,
						userId,
					});
				} catch {
					// Preserve the original artifact generation failure.
				}

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
			"Update clearly targeted content in the currently open or explicitly selected markdown text artifact.",
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
				operation: "update",
			});

			try {
				const result = await editTextArtifact({
					model,
					currentContent: latestVersion.content,
					instructions,
					operation: "update",
					onProgress: (message) => {
						writeArtifactData(dataStream, {
							event: "progress",
							artifactId: selectedArtifact.id,
							phase: "editing",
							message,
						});
					},
				});

				assertContentWithinLimit(result.content);

				writeArtifactData(dataStream, {
					event: "progress",
					artifactId: selectedArtifact.id,
					phase: "saving",
					message: "Saving the edited artifact",
				});

				const version = await appendArtifactVersion({
					artifactId: selectedArtifact.id,
					userId,
					content: result.content,
					source: "assistant",
				});

				writeArtifactData(dataStream, {
					event: "finish",
					artifactId: selectedArtifact.id,
					versionId: version.id,
					versionNumber: version.versionNumber,
					content: result.content,
					summary: result.summary,
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

export const deleteTextArtifactContentTool = ({
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
			"Delete a targeted section, paragraph, list item, or other content inside the currently open text artifact. This does not delete the artifact itself.",
		inputSchema: z.object({
			artifactId: z.string().uuid().optional(),
			instructions: z.string().min(1).max(8000),
		}),
		execute: async ({ artifactId, instructions }, { toolCallId }) => {
			const targetArtifactId = artifactId ?? activeArtifactId;
			if (!targetArtifactId) {
				throw new Error("No open artifact is available to edit");
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
				throw new Error("Artifact has no saved content to edit");
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
				operation: "delete",
			});

			try {
				const result = await editTextArtifact({
					model,
					currentContent: latestVersion.content,
					instructions,
					operation: "delete",
					onProgress: (message) => {
						writeArtifactData(dataStream, {
							event: "progress",
							artifactId: selectedArtifact.id,
							phase: "deleting",
							message,
						});
					},
				});

				assertContentWithinLimit(result.content);

				writeArtifactData(dataStream, {
					event: "progress",
					artifactId: selectedArtifact.id,
					phase: "saving",
					message: "Saving the deletion",
				});

				const version = await appendArtifactVersion({
					artifactId: selectedArtifact.id,
					userId,
					content: result.content,
					source: "assistant",
				});

				writeArtifactData(dataStream, {
					event: "finish",
					artifactId: selectedArtifact.id,
					versionId: version.id,
					versionNumber: version.versionNumber,
					content: result.content,
					summary: result.summary,
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
							: "Failed to delete artifact content",
				});
				throw error;
			}
		},
	});

export const rewriteTextArtifactTool = ({
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
			"Rewrite the complete currently open or explicitly selected markdown text artifact when the user explicitly wants a full rewrite or restructure.",
		inputSchema: z.object({
			artifactId: z.string().uuid().optional(),
			instructions: z.string().min(1).max(8000),
		}),
		execute: async ({ artifactId, instructions }, { toolCallId }) => {
			const targetArtifactId = artifactId ?? activeArtifactId;
			if (!targetArtifactId) {
				throw new Error("No open artifact is available to rewrite");
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
				throw new Error("Artifact has no saved content to rewrite");
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
				operation: "rewrite",
			});

			try {
				const result = await rewriteTextArtifact({
					model,
					currentContent: latestVersion.content,
					instructions,
					onProgress: (message) => {
						writeArtifactData(dataStream, {
							event: "progress",
							artifactId: selectedArtifact.id,
							phase: "rewriting",
							message,
						});
					},
				});

				assertContentWithinLimit(result.content);

				writeArtifactData(dataStream, {
					event: "progress",
					artifactId: selectedArtifact.id,
					phase: "saving",
					message: "Saving the rewritten artifact",
				});

				const version = await appendArtifactVersion({
					artifactId: selectedArtifact.id,
					userId,
					content: result.content,
					source: "assistant",
				});

				writeArtifactData(dataStream, {
					event: "finish",
					artifactId: selectedArtifact.id,
					versionId: version.id,
					versionNumber: version.versionNumber,
					content: result.content,
					summary: result.summary,
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
							: "Failed to rewrite artifact",
				});
				throw error;
			}
		},
	});
