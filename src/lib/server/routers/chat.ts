import { db } from '@/lib/db';
import { chat, type Message, message } from '@/lib/db/schema/app';
import { protectedProcedure, router } from '@/lib/server/trpc';
import { TRPCError } from '@trpc/server';
import { and, eq, desc, lt } from 'drizzle-orm';
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
                messages: z.any(),
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
                userId: z.string().uuid(),
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
            await db
                .delete(chat)
                .where(and(eq(chat.id, input.chatId), eq(chat.userId, ctx.session.user.id)));
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
