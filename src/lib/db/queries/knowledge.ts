import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	type Knowledge,
	knowledge,
	knowledgeEmbeddings,
} from "@/lib/db/schema/app";
import { BackpackError } from "@/lib/errors";

export async function createKnowledge({
	userId,
	spaceId,
	knowledgeType,
	knowledgeName,
	sourceUrl,
	status,
	uploadedAt,
}: {
	userId: string;
	spaceId: string;
	knowledgeType: Knowledge["knowledgeType"];
	knowledgeName: string;
	sourceUrl?: string | null;
	status: Knowledge["status"];
	uploadedAt: Date;
}) {
	try {
		const [knowledgeData] = await db
			.insert(knowledge)
			.values({
				userId,
				spaceId,
				knowledgeType,
				knowledgeName,
				sourceUrl,
				status,
				uploadedAt,
			})
			.returning({ id: knowledge.id });
		return knowledgeData;
	} catch (error) {
		throw BackpackError.database("Failed to create knowledge", error);
	}
}

export async function getKnowledgeBySpaceIdAndUserId({
	spaceId,
	userId,
}: {
	spaceId: string;
	userId: string;
}): Promise<Knowledge[]> {
	try {
		return await db
			.select()
			.from(knowledge)
			.where(
				and(
					eq(knowledge.spaceId, spaceId),
					eq(knowledge.userId, userId)
				)
			)
			.orderBy(desc(knowledge.uploadedAt));
	} catch (error) {
		throw BackpackError.database("Failed to get knowledge by space", error);
	}
}

export async function getKnowledgeByIdSpaceAndUserId({
	knowledgeId,
	spaceId,
	userId,
}: {
	knowledgeId: string;
	spaceId: string;
	userId: string;
}) {
	try {
		const [record] = await db
			.select({
				id: knowledge.id,
				status: knowledge.status,
				knowledgeType: knowledge.knowledgeType,
				sourceUrl: knowledge.sourceUrl,
			})
			.from(knowledge)
			.where(
				and(
					eq(knowledge.id, knowledgeId),
					eq(knowledge.spaceId, spaceId),
					eq(knowledge.userId, userId)
				)
			)
			.limit(1);
		return record;
	} catch (error) {
		throw BackpackError.database("Failed to get knowledge record", error);
	}
}

export async function getKnowledgeByIdAndUserId({
	knowledgeId,
	userId,
}: {
	knowledgeId: string;
	userId: string;
}) {
	try {
		const [record] = await db
			.select({
				id: knowledge.id,
				spaceId: knowledge.spaceId,
				knowledgeType: knowledge.knowledgeType,
				knowledgeName: knowledge.knowledgeName,
				sourceUrl: knowledge.sourceUrl,
				status: knowledge.status,
			})
			.from(knowledge)
			.where(
				and(eq(knowledge.id, knowledgeId), eq(knowledge.userId, userId))
			)
			.limit(1);
		return record;
	} catch (error) {
		throw BackpackError.database(
			"Failed to get knowledge by id and user",
			error
		);
	}
}

export async function insertKnowledgeEmbeddings({
	knowledgeId,
	createdAt,
	embeddings,
}: {
	knowledgeId: string;
	createdAt: Date;
	embeddings: Array<{ embedding: number[]; content: string }>;
}): Promise<void> {
	try {
		await db.insert(knowledgeEmbeddings).values(
			embeddings.map((embedding) => ({
				knowledgeId,
				createdAt,
				content: embedding.content,
				embedding: embedding.embedding,
			}))
		);
	} catch (error) {
		throw BackpackError.database(
			"Failed to insert knowledge embeddings",
			error
		);
	}
}

export async function markKnowledgeReady({
	knowledgeId,
	userId,
	knowledgeSummary,
}: {
	knowledgeId: string;
	userId: string;
	knowledgeSummary: string;
}) {
	try {
		const [updated] = await db
			.update(knowledge)
			.set({
				status: "ready",
				knowledgeSummary,
				processedAt: new Date(),
				errorMessage: null,
			})
			.where(
				and(eq(knowledge.id, knowledgeId), eq(knowledge.userId, userId))
			)
			.returning({ id: knowledge.id });
		return updated;
	} catch (error) {
		throw BackpackError.database("Failed to mark knowledge ready", error);
	}
}

export async function markKnowledgeFailed({
	knowledgeId,
	userId,
	errorMessage,
}: {
	knowledgeId: string;
	userId: string;
	errorMessage: string;
}): Promise<void> {
	try {
		await db
			.update(knowledge)
			.set({
				status: "failed",
				errorMessage,
				lastProcessingAt: new Date(),
			})
			.where(
				and(eq(knowledge.id, knowledgeId), eq(knowledge.userId, userId))
			);
	} catch (error) {
		throw BackpackError.database("Failed to mark knowledge failed", error);
	}
}

export async function resetKnowledgeForRetry({
	knowledgeId,
	userId,
}: {
	knowledgeId: string;
	userId: string;
}): Promise<void> {
	try {
		await db
			.update(knowledge)
			.set({
				status: "pending",
				errorMessage: null,
				processedAt: null,
				lastProcessingAt: null,
			})
			.where(
				and(eq(knowledge.id, knowledgeId), eq(knowledge.userId, userId))
			);
	} catch (error) {
		throw BackpackError.database("Failed to reset knowledge", error);
	}
}

export async function renameKnowledgeByIdAndUserId({
	knowledgeId,
	spaceId,
	userId,
	knowledgeName,
}: {
	knowledgeId: string;
	spaceId: string;
	userId: string;
	knowledgeName: string;
}) {
	try {
		const [updatedKnowledge] = await db
			.update(knowledge)
			.set({ knowledgeName })
			.where(
				and(
					eq(knowledge.id, knowledgeId),
					eq(knowledge.spaceId, spaceId),
					eq(knowledge.userId, userId)
				)
			)
			.returning({ id: knowledge.id });
		return updatedKnowledge;
	} catch (error) {
		throw BackpackError.database("Failed to rename knowledge", error);
	}
}

export async function deleteKnowledgeEmbeddingsByKnowledgeId({
	knowledgeId,
}: {
	knowledgeId: string;
}): Promise<void> {
	try {
		await db
			.delete(knowledgeEmbeddings)
			.where(eq(knowledgeEmbeddings.knowledgeId, knowledgeId));
	} catch (error) {
		throw BackpackError.database(
			"Failed to delete knowledge embeddings",
			error
		);
	}
}

export async function deleteKnowledgeByIdAndUserId({
	knowledgeId,
	spaceId,
	userId,
}: {
	knowledgeId: string;
	spaceId: string;
	userId: string;
}) {
	try {
		const [deletedKnowledge] = await db
			.delete(knowledge)
			.where(
				and(
					eq(knowledge.id, knowledgeId),
					eq(knowledge.spaceId, spaceId),
					eq(knowledge.userId, userId)
				)
			)
			.returning({ id: knowledge.id });
		return deletedKnowledge;
	} catch (error) {
		throw BackpackError.database("Failed to delete knowledge", error);
	}
}
