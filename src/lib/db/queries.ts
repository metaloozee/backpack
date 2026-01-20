/**
 * Centralized database queries with error handling
 * Following the Vercel AI Chatbot pattern for consistent error handling
 */
import "server-only";
import { and, asc, desc, eq, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	type Chat,
	chat,
	type Message,
	message,
	type Vote,
	vote,
} from "@/lib/db/schema/app";
import { BackpackError } from "@/lib/errors";

// ============================================================================
// Chat Queries
// ============================================================================

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
	id,
	userId,
}: {
	id: string;
	userId: string;
}): Promise<Chat | undefined> {
	try {
		const [selectedChat] = await db
			.select()
			.from(chat)
			.where(and(eq(chat.id, id), eq(chat.userId, userId)))
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

export async function deleteChatById({
	id,
	userId,
}: {
	id: string;
	userId: string;
}): Promise<Chat | undefined> {
	try {
		// Delete votes first (due to foreign key constraints)
		await db.delete(vote).where(eq(vote.chatId, id));

		// Delete messages
		await db.delete(message).where(eq(message.chatId, id));

		// Delete chat
		const [deletedChat] = await db
			.delete(chat)
			.where(and(eq(chat.id, id), eq(chat.userId, userId)))
			.returning();

		return deletedChat;
	} catch (error) {
		throw BackpackError.database("Failed to delete chat by id", error);
	}
}

// ============================================================================
// Message Queries
// ============================================================================

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

export async function saveMessages({
	messages,
}: {
	messages: Array<{
		id: string;
		chatId: string;
		role: string;
		parts: unknown;
		attachments: unknown;
		createdAt: Date;
	}>;
}): Promise<void> {
	try {
		await db.insert(message).values(
			messages.map((msg) => ({
				id: msg.id,
				chatId: msg.chatId,
				role: msg.role,
				parts: msg.parts,
				attachments: msg.attachments,
				createdAt: msg.createdAt,
			}))
		);
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

// ============================================================================
// Vote Queries
// ============================================================================

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

// ============================================================================
// Utility Queries
// ============================================================================

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
}): Promise<{ chats: Chat[]; hasMore: boolean }> {
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

		return {
			chats: hasMore ? items.slice(0, limit) : items,
			hasMore,
		};
	} catch (error) {
		throw BackpackError.database("Failed to get chats by user id", error);
	}
}
