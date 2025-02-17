import { db } from '@/lib/db';
import { chats } from '@/lib/db/schema/app';
import { protectedProcedure, router } from '@/lib/server/trpc';
import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

export const chatRouter = router({
    saveChat: protectedProcedure
        .input(
            z.object({
                chat: z.object({
                    id: z.string(),
                    userId: z.string(),
                    spaceId: z.string().optional(),
                    chatName: z.string(),
                    messages: z.array(
                        z.object({
                            role: z.union([z.string(), z.literal('data')]),
                            content: z.union([z.string(), z.any()]),
                        })
                    ),
                }),
            })
        )
        .mutation(async ({ ctx, input }) => {
            try {
                const chatToSave = {
                    ...input.chat,
                    messages: JSON.stringify(input.chat.messages),
                };

                await db
                    .insert(chats)
                    .values({
                        id: chatToSave.id,
                        userId: chatToSave.userId,
                        chatName: chatToSave.chatName,
                        messages: chatToSave.messages,
                        spaceId: chatToSave.spaceId ?? null,
                        createdAt: new Date(),
                    })
                    .onConflictDoUpdate({
                        target: chats.id,
                        set: {
                            messages: chatToSave.messages,
                        },
                    });
            } catch (error) {
                console.error(error);
            }
        }),
    deleteChat: protectedProcedure
        .input(
            z.object({
                chatId: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            try {
                await db
                    .delete(chats)
                    .where(and(eq(chats.id, input.chatId), eq(chats.userId, ctx.session.user.id)))
                    .catch((e) => {
                        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
                    });
            } catch (error) {
                console.error(error);
            }
        }),
});
