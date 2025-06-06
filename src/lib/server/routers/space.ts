import { generateEmbeddings } from '@/lib/ai/embedding';
import { extractRawText, sanitizeData } from '@/lib/ai/extractWebPage';
import { db } from '@/lib/db';
import { and, eq } from 'drizzle-orm';
import { knowledge, knowledgeEmbeddings, spaces } from '@/lib/db/schema/app';
import { protectedProcedure, router } from '@/lib/server/trpc';
import { TRPCError } from '@trpc/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export const spaceRouter = router({
    createSpace: protectedProcedure
        .input(
            z.object({
                userId: z.string(),
                spaceTitle: z.string(),
                spaceDescription: z.string().optional(),
                spaceCustomInstructions: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            try {
                const [space] = await db
                    .insert(spaces)
                    .values({
                        userId: ctx.session.user.id,
                        spaceTitle: input.spaceTitle,
                        spaceDescription: input.spaceDescription,
                        spaceCustomInstructions: input.spaceCustomInstructions,
                        createdAt: new Date(),
                    })
                    .returning({ id: spaces.id });

                if (!space.id) {
                    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
                }

                return { id: space.id };
            } catch (error) {
                console.error(error);
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
            }
        }),
    saveWebPage: protectedProcedure
        .input(
            z.object({
                spaceId: z.string(),
                url: z.string().url(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            try {
                if (input.url.length <= 0) {
                    throw new TRPCError({ code: 'BAD_REQUEST' });
                }

                const { success, result } = await extractRawText({ url: input.url });
                if (!success) {
                    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
                }

                const { success: sanitizedSuccess, sanitizedText } = await sanitizeData({
                    rawText: result![0].rawContent,
                });
                if (!sanitizedSuccess) {
                    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
                }

                const embeddings = await generateEmbeddings(sanitizedText);
                if (!embeddings) {
                    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
                }

                const [knowledgeData] = await db
                    .insert(knowledge)
                    .values({
                        userId: ctx.session.user.id,
                        spaceId: input.spaceId,
                        knowledgeType: 'webpage',
                        knowledgeName: input.url,
                        uploadedAt: new Date(),
                    })
                    .returning({ id: knowledge.id });

                await db.insert(knowledgeEmbeddings).values(
                    embeddings.map((embedding) => ({
                        knowledgeId: knowledgeData.id,
                        createdAt: new Date(),
                        ...embedding,
                    }))
                );

                revalidatePath(`/s/${input.spaceId}`);
                return { success: true };
            } catch (e) {
                console.error(e);
                throw e;
            }
        }),
});
