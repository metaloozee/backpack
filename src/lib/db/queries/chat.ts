import "server-only";

import {
	and,
	asc,
	desc,
	eq,
	type InferInsertModel,
	ilike,
	lt,
	sql,
} from "drizzle-orm";
import { db } from "@/lib/db";
import {
	type Chat,
	chat,
	type Message,
	message,
	stream,
	type Vote,
	vote,
} from "@/lib/db/schema/app";
import { BackpackError } from "@/lib/errors";

export async function getChatById({
	id,
}: {
	id: string;
}): Promise<Chat | undefined> {
	try {
		const [selectedChat] = await db
			.select()
			.from(chat)
			.where(eq(chat.id, id))
			.limit(1);
		return selectedChat;
	} catch (error) {
		throw BackpackError.database("Failed to get chat by id", error);
	}
}

export async function getChatByIdAndUserId({
	chatId,
	userId,
}: {
	chatId: string;
	userId: string;
}): Promise<Chat | undefined> {
	try {
		const [selectedChat] = await db
			.select()
			.from(chat)
			.where(and(eq(chat.id, chatId), eq(chat.userId, userId)))
			.limit(1);
		return selectedChat;
	} catch (error) {
		throw BackpackError.database(
			"Failed to get chat by id and user",
			error
		);
	}
}

export async function saveChat({
	id,
	userId,
	title,
	spaceId,
}: {
	id: string;
	userId: string;
	title: string;
	spaceId?: string;
}): Promise<void> {
	try {
		await db.insert(chat).values({
			id,
			userId,
			title,
			spaceId: spaceId ?? null,
			createdAt: new Date(),
		});
	} catch (error) {
		throw BackpackError.database("Failed to save chat", error);
	}
}

export async function setChatActiveStreamId({
	chatId,
	userId,
	activeStreamId,
}: {
	chatId: string;
	userId: string;
	activeStreamId: string | null;
}): Promise<void> {
	try {
		await db
			.update(chat)
			.set({ activeStreamId })
			.where(and(eq(chat.id, chatId), eq(chat.userId, userId)));
	} catch (error) {
		throw BackpackError.database(
			"Failed to set chat active stream id",
			error
		);
	}
}

export async function updateChatTitleIfDefault({
	chatId,
	userId,
	defaultTitle,
	newTitle,
}: {
	chatId: string;
	userId: string;
	defaultTitle: string;
	newTitle: string;
}): Promise<void> {
	try {
		await db
			.update(chat)
			.set({ title: newTitle })
			.where(
				and(
					eq(chat.id, chatId),
					eq(chat.userId, userId),
					eq(chat.title, defaultTitle)
				)
			);
	} catch (error) {
		throw BackpackError.database("Failed to update chat title", error);
	}
}

export async function searchChatsByUserId({
	userId,
	query,
	limit,
}: {
	userId: string;
	query: string;
	limit: number;
}): Promise<Chat[]> {
	try {
		return await db
			.select()
			.from(chat)
			.where(
				and(eq(chat.userId, userId), ilike(chat.title, `%${query}%`))
			)
			.orderBy(desc(chat.createdAt))
			.limit(limit);
	} catch (error) {
		throw BackpackError.database("Failed to search chats", error);
	}
}

export async function deleteChatById({
	id,
	userId,
}: {
	id: string;
	userId: string;
}): Promise<Chat | undefined> {
	try {
		const [deletedChat] = await db
			.delete(chat)
			.where(and(eq(chat.id, id), eq(chat.userId, userId)))
			.returning();

		return deletedChat;
	} catch (error) {
		throw BackpackError.database("Failed to delete chat by id", error);
	}
}

export async function getMessagesByChatId({
	id,
}: {
	id: string;
}): Promise<Message[]> {
	try {
		return await db
			.select()
			.from(message)
			.where(eq(message.chatId, id))
			.orderBy(asc(message.createdAt));
	} catch (error) {
		throw BackpackError.database(
			"Failed to get messages by chat id",
			error
		);
	}
}

export async function getMessagesByChatIdAndUserId({
	chatId,
	userId,
}: {
	chatId: string;
	userId: string;
}): Promise<Message[]> {
	try {
		const rows = await db
			.select()
			.from(message)
			.innerJoin(chat, eq(message.chatId, chat.id))
			.where(and(eq(message.chatId, chatId), eq(chat.userId, userId)))
			.orderBy(asc(message.createdAt));
		return rows.map((row) => row.message);
	} catch (error) {
		throw BackpackError.database(
			"Failed to get messages by chat id and user",
			error
		);
	}
}

export async function saveMessages({
	messages,
}: {
	messages: InferInsertModel<typeof message>[];
}): Promise<void> {
	try {
		await db
			.insert(message)
			.values(
				messages.map((msg) => ({
					id: msg.id,
					chatId: msg.chatId,
					role: msg.role,
					parts: msg.parts,
					attachments: msg.attachments,
					createdAt: msg.createdAt,
				}))
			)
			.onConflictDoUpdate({
				target: message.id,
				set: {
					chatId: sql`excluded.chat_id`,
					role: sql`excluded.role`,
					parts: sql`excluded.parts`,
					attachments: sql`excluded.attachments`,
					createdAt: sql`excluded.created_at`,
				},
			});
	} catch (error) {
		throw BackpackError.database("Failed to save messages", error);
	}
}

export async function getMessageById({
	id,
}: {
	id: string;
}): Promise<Message | undefined> {
	try {
		const [selectedMessage] = await db
			.select()
			.from(message)
			.where(eq(message.id, id))
			.limit(1);
		return selectedMessage;
	} catch (error) {
		throw BackpackError.database("Failed to get message by id", error);
	}
}

export async function getLatestMessageByChatId({
	chatId,
}: {
	chatId: string;
}): Promise<Message | undefined> {
	try {
		const [selectedMessage] = await db
			.select()
			.from(message)
			.where(eq(message.chatId, chatId))
			.orderBy(desc(message.createdAt))
			.limit(1);
		return selectedMessage;
	} catch (error) {
		throw BackpackError.database(
			"Failed to get latest message by chat id",
			error
		);
	}
}

export async function voteMessage({
	chatId,
	messageId,
	type,
}: {
	chatId: string;
	messageId: string;
	type: "up" | "down";
}): Promise<void> {
	try {
		const [existingVote] = await db
			.select()
			.from(vote)
			.where(eq(vote.messageId, messageId))
			.limit(1);

		if (existingVote) {
			await db
				.update(vote)
				.set({ isUpvoted: type === "up" })
				.where(
					and(eq(vote.messageId, messageId), eq(vote.chatId, chatId))
				);
		} else {
			await db.insert(vote).values({
				chatId,
				messageId,
				isUpvoted: type === "up",
			});
		}
	} catch (error) {
		throw BackpackError.database("Failed to vote message", error);
	}
}

export async function getVotesByChatId({
	id,
}: {
	id: string;
}): Promise<Vote[]> {
	try {
		return await db.select().from(vote).where(eq(vote.chatId, id));
	} catch (error) {
		throw BackpackError.database("Failed to get votes by chat id", error);
	}
}

export async function getLatestStreamIdByChatId({
	chatId,
}: {
	chatId: string;
}): Promise<string | undefined> {
	try {
		const [row] = await db
			.select({ id: stream.id })
			.from(stream)
			.where(eq(stream.chatId, chatId))
			.orderBy(desc(stream.createdAt))
			.limit(1);
		return row?.id;
	} catch (error) {
		throw BackpackError.database(
			"Failed to get latest stream id by chat id",
			error
		);
	}
}

export async function createStream({
	id,
	chatId,
	createdAt,
}: {
	id: string;
	chatId: string;
	createdAt: Date;
}): Promise<void> {
	try {
		await db.insert(stream).values({ id, chatId, createdAt });
	} catch (error) {
		throw BackpackError.database("Failed to create stream", error);
	}
}

export async function getChatsByUserId({
	userId,
	limit,
	cursor,
	spaceId,
}: {
	userId: string;
	limit: number;
	cursor?: Date;
	spaceId?: string;
}): Promise<{ chats: Chat[]; nextCursor?: Date }> {
	try {
		const conditions = [eq(chat.userId, userId)];

		if (spaceId) {
			conditions.push(eq(chat.spaceId, spaceId));
		}

		if (cursor) {
			conditions.push(lt(chat.createdAt, cursor));
		}

		const items = await db
			.select()
			.from(chat)
			.limit(limit + 1)
			.where(and(...conditions))
			.orderBy(desc(chat.createdAt));

		const hasMore = items.length > limit;
		const chats = hasMore ? items.slice(0, limit) : items;
		const nextCursor = hasMore ? chats.at(-1)?.createdAt : undefined;

		return {
			chats,
			nextCursor,
		};
	} catch (error) {
		throw BackpackError.database("Failed to get chats by user id", error);
	}
}
