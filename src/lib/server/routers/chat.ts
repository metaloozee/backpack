import { db } from '@/lib/db';
import { type Message, message } from '@/lib/db/schema/app';
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
});
