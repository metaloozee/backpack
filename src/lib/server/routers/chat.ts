import { db } from '@/lib/db';
import { chat, type Message, message } from '@/lib/db/schema/app';
import { protectedProcedure, router } from '@/lib/server/trpc';
import { TRPCError } from '@trpc/server';
import { and, eq, desc, lt, gte, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

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
            const items = await db
                .select()
                .from(chat)
                .limit(input.limit + 1)
                .where(
                    and(
                        and(
                            eq(chat.userId, ctx.session.user.id),
                            input.spaceId ? eq(chat.spaceId, input.spaceId) : undefined
                        ),
                        input.cursor ? lt(chat.createdAt, input.cursor) : undefined
                    )
                )
                .orderBy(desc(chat.createdAt));

            const hasMore = items.length > input.limit;
            const itemsToReturn = hasMore ? items.slice(0, input.limit) : items;

            const nextCursor = hasMore
                ? itemsToReturn[itemsToReturn.length - 1].createdAt
                : undefined;

            return {
                chats: itemsToReturn,
                nextCursor,
            };
        }),
    saveMessages: protectedProcedure
        .input(
            z.object({
                messages: z.array(
                    z.object({
                        id: z.string().uuid(),
                        chatId: z.string().uuid(),
                        role: z.enum(['user', 'data', 'assistant', 'system']),
                        parts: z.array(z.any()).default([]),
                        attachments: z.array(z.any()).default([]),
                        createdAt: z.coerce.date(),
                    })
                ),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const messageInsertSchema = createInsertSchema(message);
            const parsedMessages = input.messages.map((message: Message) =>
                messageInsertSchema.parse(message)
            );
            return await db.insert(message).values(parsedMessages);
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
            return await db.insert(chat).values({
                id: input.id,
                spaceId: input.spaceId,
                userId: ctx.session.user.id,
                title: input.title,
                createdAt: new Date(),
            });
        }),
    deleteChat: protectedProcedure
        .input(
            z.object({
                chatId: z.string().uuid(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            return await db
                .delete(chat)
                .where(and(eq(chat.id, input.chatId), eq(chat.userId, ctx.session.user.id)));
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
                .where(and(eq(chat.userId, ctx.session.user.id), eq(message.id, input.messageId)))
                .limit(1);

            if (!currentMessage) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Message not found' });
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
    setModelSelection: protectedProcedure
        .input(
            z.object({
                modelId: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const cookieStore = await cookies();

            cookieStore.set('X-Model-Id', input.modelId, {
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
            });

            return { success: true, modelId: input.modelId };
        }),
});
