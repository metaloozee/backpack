/** biome-ignore-all lint/nursery/noShadow: false positive */
/** biome-ignore-all lint/suspicious/noConsole: console.log */
import { elevenlabs } from "@ai-sdk/elevenlabs";
import { TRPCError } from "@trpc/server";
import { experimental_transcribe as transcribe } from "ai";
import { and, eq, gte } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { db } from "@/lib/db";
import {
	createStream,
	deleteChatById,
	getChatsByUserId,
	getVotesByChatId,
	saveChat,
	saveMessages as saveMessagesQuery,
	searchChatsByUserId,
	setChatActiveStreamId,
	voteMessage as voteMessageQuery,
} from "@/lib/db/queries";
import { chat, type Message, message } from "@/lib/db/schema/app";
import { BackpackError } from "@/lib/errors";
import { protectedProcedure, router } from "@/lib/server/trpc";

export const chatRouter = router({
	getChats: protectedProcedure
		.input(
			z.object({
				limit: z.number(),
				spaceId: z.string().uuid().optional(),
				cursor: z.date().optional(),
			})
		)
		.query(async ({ ctx, input }) => {
			return await getChatsByUserId({
				userId: ctx.session.user.id,
				limit: input.limit,
				cursor: input.cursor,
				spaceId: input.spaceId,
			});
		}),
	getChatById: protectedProcedure
		.input(
			z.object({
				chatId: z.string().uuid(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			try {
				const [selectedChat] = await db
					.select()
					.from(chat)
					.where(
						and(
							eq(chat.id, input.chatId),
							eq(chat.userId, ctx.session.userId)
						)
					)
					.limit(1);

				return selectedChat;
			} catch (_) {
				throw BackpackError.api("not_found", "Chat not found");
			}
		}),
	searchChats: protectedProcedure
		.input(
			z.object({
				query: z.string().min(1),
				limit: z.number().default(10),
			})
		)
		.query(async ({ ctx, input }) => {
			const chats = await searchChatsByUserId({
				userId: ctx.session.user.id,
				query: input.query,
				limit: input.limit,
			});
			return { chats };
		}),
	saveMessages: protectedProcedure
		.input(
			z.object({
				messages: z.array(
					z.object({
						id: z.string().uuid(),
						chatId: z.string().uuid(),
						role: z.enum(["user", "data", "assistant", "system"]),
						parts: z.array(z.any()).default([]),
						attachments: z.array(z.any()).default([]),
						createdAt: z.coerce.date(),
					})
				),
			})
		)
		.mutation(async ({ input }) => {
			const messageInsertSchema = createInsertSchema(message);
			const parsedMessages = input.messages.map((message: Message) =>
				messageInsertSchema.parse(message)
			);
			await saveMessagesQuery({ messages: parsedMessages });
			return { success: true };
		}),
	saveChat: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				userId: z.string(),
				spaceId: z.string().uuid().optional(),
				title: z.string().max(100),
			})
		)
		.mutation(async ({ ctx, input }) => {
			await saveChat({
				id: input.id,
				userId: ctx.session.user.id,
				title: input.title,
				spaceId: input.spaceId,
			});
			return { success: true };
		}),
	saveChatActiveStreamId: protectedProcedure
		.input(
			z.object({
				chatId: z.string().uuid(),
				userId: z.string().uuid(),
				activeStreamId: z.string().nullable(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			await setChatActiveStreamId({
				chatId: input.chatId,
				userId: ctx.session.user.id,
				activeStreamId: input.activeStreamId,
			});

			return { success: true };
		}),
	createStream: protectedProcedure
		.input(
			z.object({
				chatId: z.string().uuid(),
				streamId: z.string().uuid(),
				createdAt: z.date(),
			})
		)
		.mutation(async ({ ctx: _ctx, input }) => {
			await createStream({
				id: input.streamId,
				chatId: input.chatId,
				createdAt: input.createdAt,
			});
			return { success: true };
		}),
	deleteChat: protectedProcedure
		.input(
			z.object({
				chatId: z.string().uuid(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			return await deleteChatById({
				id: input.chatId,
				userId: ctx.session.user.id,
			});
		}),
	deleteTrailingMessages: protectedProcedure
		.input(
			z.object({
				messageId: z.string().uuid(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const [currentMessage] = await db
				.select({
					messageId: message.id,
					chatId: message.chatId,
					createdAt: message.createdAt,
					userId: chat.userId,
				})
				.from(message)
				.innerJoin(chat, eq(message.chatId, chat.id))
				.where(
					and(
						eq(chat.userId, ctx.session.user.id),
						eq(message.id, input.messageId)
					)
				)
				.limit(1);

			if (!currentMessage) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Message not found",
				});
			}

			return await db
				.delete(message)
				.where(
					and(
						eq(message.chatId, currentMessage.chatId),
						gte(message.createdAt, currentMessage.createdAt)
					)
				);
		}),
	transcribe: protectedProcedure
		.input(z.instanceof(FormData))
		.mutation(async ({ input }) => {
			const audioFile = (await input.get("audio")) as File;
			if (!audioFile) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No audio file provided",
				});
			}

			const buffer = Buffer.from(await audioFile.arrayBuffer());

			try {
				const transcript = await transcribe({
					// model: deepgram.transcription('nova-2'),
					model: elevenlabs.transcription("scribe_v1"),
					audio: buffer,
				});

				if (!transcript) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to transcribe audio",
					});
				}

				return {
					text: transcript.text,
					language: transcript.language,
				};
			} catch (error) {
				console.error("Failed to transcribe audio", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to transcribe audio",
				});
			}
		}),
	voteMessage: protectedProcedure
		.input(
			z.object({
				chatId: z.string().uuid(),
				messageId: z.string().uuid(),
				type: z.enum(["up", "down"]),
			})
		)
		.mutation(async ({ ctx, input }) => {
			// Verify the chat belongs to the user
			const [chatRecord] = await db
				.select()
				.from(chat)
				.where(
					and(
						eq(chat.id, input.chatId),
						eq(chat.userId, ctx.session.user.id)
					)
				)
				.limit(1);

			if (!chatRecord) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Chat not found",
				});
			}

			await voteMessageQuery({
				chatId: input.chatId,
				messageId: input.messageId,
				type: input.type,
			});
			return { success: true };
		}),
	getVotesByChatId: protectedProcedure
		.input(
			z.object({
				chatId: z.string().uuid(),
			})
		)
		.query(async ({ ctx, input }) => {
			// Verify the chat belongs to the user
			const [chatRecord] = await db
				.select()
				.from(chat)
				.where(
					and(
						eq(chat.id, input.chatId),
						eq(chat.userId, ctx.session.user.id)
					)
				)
				.limit(1);

			if (!chatRecord) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Chat not found",
				});
			}

			return await getVotesByChatId({ id: input.chatId });
		}),
});
