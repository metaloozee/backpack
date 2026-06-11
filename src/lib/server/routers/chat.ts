/** biome-ignore-all lint/nursery/noShadow: false positive */
/** biome-ignore-all lint/suspicious/noConsole: console.log */
import { elevenlabs } from "@ai-sdk/elevenlabs";
import { TRPCError } from "@trpc/server";
import { experimental_transcribe as transcribe } from "ai";
import { and, eq, gte } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
	createStream,
	deleteChatById,
	getChatByIdAndUserId,
	getChatsByUserId,
	getMessagesByChatIdAndUserId,
	getVotesByChatId,
	saveChat,
	searchChatsByUserId,
	setChatActiveStreamId,
	updateChatTitleIfDefault,
	voteMessage as voteMessageQuery,
} from "@/lib/db/queries/chat";
import { getMcpServerConfigsByIds } from "@/lib/db/queries/mcp";
import { getMemoriesByUserId } from "@/lib/db/queries/memories";
import { chat, message } from "@/lib/db/schema/app";
import { BackpackError } from "@/lib/errors";
import { protectedProcedure, router } from "@/lib/server/trpc";

const MAX_TRANSCRIPTION_AUDIO_BYTES = 25 * 1024 * 1024;
const ALLOWED_TRANSCRIPTION_MIME_TYPES = new Set([
	"audio/mpeg",
	"audio/mp3",
	"audio/mp4",
	"audio/wav",
	"audio/webm",
	"audio/ogg",
	"audio/x-m4a",
]);

export const chatRouter = router({
	getChatRuntimeData: protectedProcedure
		.input(
			z.object({
				chatId: z.string().uuid(),
				mcpServerIds: z.array(z.string().uuid()).default([]),
			})
		)
		.query(async ({ ctx, input }) => {
			const [
				selectedChat,
				previousMessages,
				userMemories,
				mcpServerConfigs,
			] = await Promise.all([
				getChatByIdAndUserId({
					chatId: input.chatId,
					userId: ctx.session.user.id,
				}),
				getMessagesByChatIdAndUserId({
					chatId: input.chatId,
					userId: ctx.session.user.id,
				}),
				getMemoriesByUserId({ userId: ctx.session.user.id }),
				input.mcpServerIds.length > 0
					? getMcpServerConfigsByIds({
							ids: input.mcpServerIds,
							userId: ctx.session.user.id,
						})
					: Promise.resolve([]),
			]);

			return {
				chat: selectedChat,
				previousMessages,
				userMemories,
				mcpServerConfigs,
			};
		}),
	getChats: protectedProcedure
		.input(
			z.object({
				limit: z.number(),
				spaceId: z.string().uuid().optional(),
				cursor: z.date().optional(),
			})
		)
		.query(
			async ({ ctx, input }) =>
				await getChatsByUserId({
					userId: ctx.session.user.id,
					limit: input.limit,
					cursor: input.cursor,
					spaceId: input.spaceId,
				})
		),
	getChatById: protectedProcedure
		.input(
			z.object({
				chatId: z.string().uuid(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			try {
				return await getChatByIdAndUserId({
					chatId: input.chatId,
					userId: ctx.session.user.id,
				});
			} catch {
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
	saveChat: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
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
			})
		)
		.mutation(async ({ ctx: _ctx, input }) => {
			await createStream({
				id: input.streamId,
				chatId: input.chatId,
				createdAt: new Date(),
			});
			return { success: true };
		}),
	updateChatTitleIfDefault: protectedProcedure
		.input(
			z.object({
				chatId: z.string().uuid(),
				defaultTitle: z.string().min(1).max(100),
				newTitle: z.string().min(1).max(100),
			})
		)
		.mutation(async ({ ctx, input }) => {
			await updateChatTitleIfDefault({
				chatId: input.chatId,
				userId: ctx.session.user.id,
				defaultTitle: input.defaultTitle,
				newTitle: input.newTitle,
			});

			return { success: true };
		}),
	deleteChat: protectedProcedure
		.input(
			z.object({
				chatId: z.string().uuid(),
			})
		)
		.mutation(
			async ({ ctx, input }) =>
				await deleteChatById({
					id: input.chatId,
					userId: ctx.session.user.id,
				})
		),
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
			const audioFile = input.get("audio");
			if (!(audioFile instanceof File)) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No audio file provided",
				});
			}

			if (audioFile.size === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Audio file is empty",
				});
			}

			if (audioFile.size > MAX_TRANSCRIPTION_AUDIO_BYTES) {
				throw new TRPCError({
					code: "PAYLOAD_TOO_LARGE",
					message: "Audio file must be 25 MB or smaller",
				});
			}

			if (!ALLOWED_TRANSCRIPTION_MIME_TYPES.has(audioFile.type)) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Unsupported audio file type",
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
