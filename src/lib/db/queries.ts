import "server-only";
import {
	and,
	asc,
	cosineDistance,
	desc,
	eq,
	type InferInsertModel,
	ilike,
	inArray,
	lt,
	sql,
} from "drizzle-orm";
import { db } from "@/lib/db";
import {
	type Chat,
	chat,
	type Knowledge,
	knowledge,
	knowledgeEmbeddings,
	type Memory,
	type Message,
	memories,
	message,
	spaces,
	stream,
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

export async function markKnowledgeProcessing({
	knowledgeId,
	userId,
}: {
	knowledgeId: string;
	userId: string;
}) {
	try {
		const [updated] = await db
			.update(knowledge)
			.set({
				status: "processing",
				processingAttempts: sql<number>`${knowledge.processingAttempts} + 1`,
				lastProcessingAt: new Date(),
				processedAt: null,
				errorMessage: null,
			})
			.where(
				and(eq(knowledge.id, knowledgeId), eq(knowledge.userId, userId))
			)
			.returning({ id: knowledge.id });
		return updated;
	} catch (error) {
		throw BackpackError.database(
			"Failed to mark knowledge processing",
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
