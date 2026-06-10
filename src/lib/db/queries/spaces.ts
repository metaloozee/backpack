import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { chat, spaces } from "@/lib/db/schema/app";
import { BackpackError } from "@/lib/errors";

export async function getSpaceByIdAndUserId({
	spaceId,
	userId,
}: {
	spaceId: string;
	userId: string;
}) {
	try {
		const [selectedSpace] = await db
			.select()
			.from(spaces)
			.where(and(eq(spaces.id, spaceId), eq(spaces.userId, userId)))
			.limit(1);
		return selectedSpace;
	} catch (error) {
		throw BackpackError.database(
			"Failed to get space by id and user",
			error
		);
	}
}

export async function getSpaceOverview({
	spaceId,
	userId,
}: {
	spaceId: string;
	userId: string;
}) {
	try {
		const [spaceData] = await db
			.select()
			.from(spaces)
			.where(and(eq(spaces.id, spaceId), eq(spaces.userId, userId)))
			.limit(1);

		if (!spaceData) {
			return { spaceData: undefined, hasChats: false };
		}

		const [firstChat] = await db
			.select({ id: chat.id })
			.from(chat)
			.where(and(eq(chat.spaceId, spaceId), eq(chat.userId, userId)))
			.limit(1);

		return { spaceData, hasChats: Boolean(firstChat) };
	} catch (error) {
		throw BackpackError.database("Failed to get space overview", error);
	}
}

export async function getSpacesByUserId({
	userId,
	limit,
}: {
	userId: string;
	limit: number;
}) {
	try {
		return await db
			.select()
			.from(spaces)
			.where(eq(spaces.userId, userId))
			.orderBy(desc(spaces.createdAt))
			.limit(limit);
	} catch (error) {
		throw BackpackError.database("Failed to get spaces by user", error);
	}
}

export async function createSpace({
	userId,
	spaceTitle,
	spaceDescription,
	spaceCustomInstructions,
}: {
	userId: string;
	spaceTitle: string;
	spaceDescription?: string;
	spaceCustomInstructions?: string;
}) {
	try {
		const [space] = await db
			.insert(spaces)
			.values({
				userId,
				spaceTitle,
				spaceDescription,
				spaceCustomInstructions,
				createdAt: new Date(),
			})
			.returning({ id: spaces.id });
		return space;
	} catch (error) {
		throw BackpackError.database("Failed to create space", error);
	}
}

export async function updateSpace({
	spaceId,
	userId,
	spaceTitle,
	spaceDescription,
	spaceCustomInstructions,
}: {
	spaceId: string;
	userId: string;
	spaceTitle: string;
	spaceDescription?: string;
	spaceCustomInstructions?: string;
}) {
	try {
		const [space] = await db
			.update(spaces)
			.set({
				spaceTitle,
				spaceDescription,
				spaceCustomInstructions,
			})
			.where(and(eq(spaces.id, spaceId), eq(spaces.userId, userId)))
			.returning({ id: spaces.id });
		return space;
	} catch (error) {
		throw BackpackError.database("Failed to update space", error);
	}
}

export async function deleteSpaceByIdAndUserId({
	spaceId,
	userId,
}: {
	spaceId: string;
	userId: string;
}) {
	try {
		const [space] = await db
			.delete(spaces)
			.where(and(eq(spaces.id, spaceId), eq(spaces.userId, userId)))
			.returning({ id: spaces.id });
		return space;
	} catch (error) {
		throw BackpackError.database("Failed to delete space", error);
	}
}
