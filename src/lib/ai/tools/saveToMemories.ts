import { tool, UIMessageStreamWriter } from 'ai';
import { z } from 'zod';
import { embedMany } from 'ai';
import { google } from '@ai-sdk/google';
import { db } from '@/lib/db';
import { memories as dbMemories } from '@/lib/db/schema/app';
import { cosineDistance, sql, eq, and, gt } from 'drizzle-orm';
import { Session } from 'better-auth';

export const saveToMemoriesTool = ({
    session,
    dataStream,
}: {
    session: Session;
    dataStream: UIMessageStreamWriter;
}) =>
    tool({
        description: 'Save the information about the user to their memories.',
        inputSchema: z.object({
            contents: z.array(z.string()).min(1).max(5),
        }),
        execute: async ({ contents }, { toolCallId }) => {
            dataStream.write({
                type: 'tool-input-available',
                toolCallId,
                toolName: 'save_to_memories',
                input: JSON.stringify({ contents }),
            });

            console.log('Saving memories: ', contents);

            try {
                const { embeddings } = await embedMany({
                    model: google.textEmbeddingModel('text-embedding-004'),
                    values: contents,
                });

                const newMemories: {
                    userId: string;
                    content: string;
                    embedding: number[];
                    createdAt: Date;
                }[] = [];

                for (let i = 0; i < contents.length; i++) {
                    const content = contents[i];
                    const embedding = embeddings[i];

                    const similarity = sql<number>`1 - (${cosineDistance(
                        dbMemories.embedding,
                        embedding
                    )})`;

                    const existingSimilarMemories = await db
                        .select({ similarity })
                        .from(dbMemories)
                        .where(
                            and(
                                eq(dbMemories.userId, session.userId),
                                gt(similarity, 0.85) // High similarity threshold to avoid duplicates
                            )
                        )
                        .limit(1);

                    if (existingSimilarMemories.length === 0) {
                        newMemories.push({
                            userId: session.userId,
                            content: content,
                            embedding: embedding,
                            createdAt: new Date(),
                        });
                    }
                }

                let savedCount = 0;
                if (newMemories.length > 0) {
                    await db.insert(dbMemories).values(newMemories);
                    savedCount = newMemories.length;
                }

                const result = {
                    saved_count: savedCount,
                    total_count: contents.length,
                };

                dataStream.write({
                    type: 'tool-output-available',
                    toolCallId,
                    output: JSON.stringify({ result }),
                });

                return result;
            } catch (error) {
                console.error('Error saving memories:', error);
                throw new Error('Failed to save memories');
            }
        },
    });
