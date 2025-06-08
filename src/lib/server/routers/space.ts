import { generateEmbeddings } from '@/lib/ai/embedding';
import { extractRawText, sanitizeData } from '@/lib/ai/extractWebPage';
import { db } from '@/lib/db';
import { and, eq } from 'drizzle-orm';
import { knowledge, knowledgeEmbeddings, spaces, KnowledgeTypeEnum } from '@/lib/db/schema/app';
import { protectedProcedure, router } from '@/lib/server/trpc';
import { TRPCError } from '@trpc/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export const spaceRouter = router({
    createSpace: protectedProcedure
        .input(
            z.object({
                userId: z.string(),
                spaceTitle: z.string().min(1).max(255),
                spaceDescription: z.string().max(1000).optional(),
                spaceCustomInstructions: z.string().max(2000).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            if (input.userId !== ctx.session.user.id) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Access denied',
                });
            }

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
        }),
    saveWebPage: protectedProcedure
        .input(
            z.object({
                spaceId: z.string(),
                url: z.string().url(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const [spaceExists] = await db
                .select()
                .from(spaces)
                .where(and(eq(spaces.id, input.spaceId), eq(spaces.userId, ctx.session.user.id)))
                .limit(1);

            if (!spaceExists) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Space not found',
                });
            }

            const { success, result } = await extractRawText({ url: input.url });
            if (!success || !result) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Failed to extract content from URL',
                });
            }

            const { success: sanitizedSuccess, sanitizedText } = await sanitizeData({
                rawText: result[0].rawContent,
            });
            if (!sanitizedSuccess || !sanitizedText) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Failed to sanitize extracted content',
                });
            }

            const embeddings = await generateEmbeddings(sanitizedText);
            if (!embeddings || embeddings.length === 0) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to generate embeddings',
                });
            }

            const [knowledgeData] = await db
                .insert(knowledge)
                .values({
                    userId: ctx.session.user.id,
                    spaceId: input.spaceId,
                    knowledgeType: 'webpage' as const,
                    knowledgeName: input.url,
                    knowledgeSummary:
                        sanitizedText.slice(0, 500) + (sanitizedText.length > 500 ? '...' : ''),
                    uploadedAt: new Date(),
                })
                .returning({ id: knowledge.id });

            await db.insert(knowledgeEmbeddings).values(
                embeddings.map((embedding) => ({
                    knowledgeId: knowledgeData.id,
                    createdAt: new Date(),
                    content: embedding.content,
                    embedding: embedding.embedding,
                }))
            );

            revalidatePath(`/s/${input.spaceId}`);
            return { success: true };
        }),
});
