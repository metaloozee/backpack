import { google } from "@ai-sdk/google";
import { embedMany, tool, type UIMessageStreamWriter } from "ai";
import type { Session } from "better-auth";
import { and, cosineDistance, eq, sql } from "drizzle-orm";
import { z } from "zod";
import {
	GOOGLE_EMBEDDING_DIMENSIONS,
	GOOGLE_EMBEDDING_MODEL,
} from "@/lib/ai/defaults";
import { db } from "@/lib/db";
import { knowledge, knowledgeEmbeddings } from "@/lib/db/schema/app";

export const knowledgeSearchTool = ({
	session,
	dataStream,
	env,
}: {
	session: Session;
	dataStream: UIMessageStreamWriter;
	env: { inSpace: boolean; spaceId?: string };
}) =>
	tool({
		description:
			"Performs an Internal Semantic Search on User Uploaded Documents.",
		inputSchema: z.object({
			knowledge_search_keywords: z.array(z.string()).max(5),
		}),
		execute: async (
			{ knowledge_search_keywords: keywords },
			{ toolCallId }
		) => {
			dataStream.write({
				type: "tool-input-available",
				toolCallId,
				toolName: "knowledge_search",
				input: JSON.stringify({ knowledge_search_keywords: keywords }),
			});

			const { embeddings } = await embedMany({
				model: google.embeddingModel(GOOGLE_EMBEDDING_MODEL),
				providerOptions: {
					google: {
						outputDimensionality: GOOGLE_EMBEDDING_DIMENSIONS,
						taskType: "RETRIEVAL_QUERY",
					},
				},
				values: keywords,
			});

			const promises = embeddings.map(
				async (embedding, index: number) => {
					const distance = cosineDistance(
						knowledgeEmbeddings.embedding,
						embedding
					);
					const similarity = sql<number>`1 - (${distance})`;

					const contexts = await db
						.select({
							content: knowledgeEmbeddings.content,
							knowledgeId: knowledge.id,
							knowledgeName: knowledge.knowledgeName,
							knowledgeType: knowledge.knowledgeType,
							sourceUrl: knowledge.sourceUrl,
							similarity,
						})
						.from(knowledgeEmbeddings)
						.innerJoin(
							knowledge,
							eq(knowledgeEmbeddings.knowledgeId, knowledge.id)
						)
						.where(
							and(
								eq(knowledge.userId, session.userId),
								eq(knowledge.status, "ready"),
								env.inSpace
									? eq(knowledge.spaceId, env.spaceId || "")
									: sql`true`
							)
						)
						.orderBy(distance)
						.limit(10);

					const filteredContexts = contexts.filter(
						(context) => context.similarity > 0.5
					);

					return {
						keyword: keywords[index],
						contexts: filteredContexts,
					};
				}
			);

			const results = await Promise.all(promises);

			dataStream.write({
				type: "tool-output-available",
				toolCallId,
				output: JSON.stringify({ results }),
			});

			return {
				results,
			};
		},
	});
