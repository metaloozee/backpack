import { google } from "@ai-sdk/google";
import { embedMany, tool, type UIMessageStreamWriter } from "ai";
import { z } from "zod";
import {
	GOOGLE_EMBEDDING_DIMENSIONS,
	GOOGLE_EMBEDDING_MODEL,
} from "@/lib/ai/defaults";
import { getClosestMemorySimilarity, insertMemories } from "@/lib/db/queries";

export const saveToMemoriesTool = ({
	userId,
	dataStream,
}: {
	userId: string;
	dataStream: UIMessageStreamWriter;
}) =>
	tool({
		description: "Save the information about the user to their memories.",
		inputSchema: z.object({
			contents: z.array(z.string()).min(1).max(5),
		}),
		execute: async ({ contents }, { toolCallId }) => {
			dataStream.write({
				type: "tool-input-available",
				toolCallId,
				toolName: "save_to_memories",
				input: JSON.stringify({ contents }),
			});

			try {
				const { embeddings } = await embedMany({
					model: google.embeddingModel(GOOGLE_EMBEDDING_MODEL),
					providerOptions: {
						google: {
							outputDimensionality: GOOGLE_EMBEDDING_DIMENSIONS,
							taskType: "SEMANTIC_SIMILARITY",
						},
					},
					values: contents,
				});

				const newMemories: {
					userId: string;
					content: string;
					embedding: number[];
					createdAt: Date;
				}[] = [];

				for (let i = 0; i < contents.length; i++) {
					const content = contents[i];
					const embedding = embeddings[i];

					const similarity = await getClosestMemorySimilarity({
						userId,
						embedding,
					});

					if (similarity === null || similarity <= 0.85) {
						newMemories.push({
							userId,
							content,
							embedding,
							createdAt: new Date(),
						});
					}
				}

				let savedCount = 0;
				if (newMemories.length > 0) {
					await insertMemories({ values: newMemories });
					savedCount = newMemories.length;
				}

				const result = {
					saved_count: savedCount,
					total_count: contents.length,
				};

				dataStream.write({
					type: "tool-output-available",
					toolCallId,
					output: JSON.stringify({ result }),
				});

				return result;
			} catch {
				throw new Error("Failed to save memories");
			}
		},
	});
