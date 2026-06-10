import "server-only";

import {
	and,
	cosineDistance,
	desc,
	eq,
	type InferInsertModel,
	inArray,
	sql,
} from "drizzle-orm";
import { db } from "@/lib/db";
import { type Memory, memories } from "@/lib/db/schema/app";
import { BackpackError } from "@/lib/errors";

export async function getMemoriesByUserId({
	userId,
}: {
	userId: string;
}): Promise<Memory[]> {
	try {
		return await db
			.select()
			.from(memories)
			.where(eq(memories.userId, userId))
			.orderBy(desc(memories.createdAt));
	} catch (error) {
		throw BackpackError.database("Failed to get memories by user", error);
	}
}

export async function getClosestMemorySimilarity({
	userId,
	embedding,
}: {
	userId: string;
	embedding: number[];
}): Promise<number | null> {
	try {
		const distance = cosineDistance(memories.embedding, embedding);
		const similarity = sql<number>`1 - (${distance})`;
		const [row] = await db
			.select({ similarity })
			.from(memories)
			.where(eq(memories.userId, userId))
			.orderBy(distance)
			.limit(1);
		return row?.similarity ?? null;
	} catch (error) {
		throw BackpackError.database(
			"Failed to get closest memory similarity",
			error
		);
	}
}

export async function insertMemories({
	values,
}: {
	values: InferInsertModel<typeof memories>[];
}): Promise<void> {
	try {
		await db.insert(memories).values(values);
	} catch (error) {
		throw BackpackError.database("Failed to insert memories", error);
	}
}

export async function deleteMemoryByIdAndUserId({
	id,
	userId,
}: {
	id: string;
	userId: string;
}): Promise<void> {
	try {
		await db
			.delete(memories)
			.where(and(eq(memories.id, id), eq(memories.userId, userId)));
	} catch (error) {
		throw BackpackError.database("Failed to delete memory", error);
	}
}

export async function deleteMemoriesByIdsAndUserId({
	ids,
	userId,
}: {
	ids: string[];
	userId: string;
}): Promise<void> {
	try {
		await db
			.delete(memories)
			.where(and(eq(memories.userId, userId), inArray(memories.id, ids)));
	} catch (error) {
		throw BackpackError.database("Failed to delete memories", error);
	}
}

export async function deleteAllMemoriesByUserId({
	userId,
}: {
	userId: string;
}): Promise<void> {
	try {
		await db.delete(memories).where(eq(memories.userId, userId));
	} catch (error) {
		throw BackpackError.database("Failed to delete all memories", error);
	}
}
