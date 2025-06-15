import { db } from '@/lib/db';
import { chat, type Message, message } from '@/lib/db/schema/app';
import { protectedProcedure, router } from '@/lib/server/trpc';
import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';

export const chatRouter = router({
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
            return await db
                .delete(chat)
                .where(and(eq(chat.id, input.chatId), eq(chat.userId, ctx.session.user.id)));
        }),
});
