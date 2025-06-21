import {
    convertToCoreMessages,
    appendResponseMessages,
    smoothStream,
    streamText,
    embedMany,
    appendClientMessage,
    createDataStream,
    generateObject,
} from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateUUID, getTrailingMessageId } from '@/lib/ai/utils';

import { env } from '@/lib/env.mjs';

import { getUserAuth } from '@/lib/auth/utils';
import { api } from '@/lib/trpc/api';
import { AskModePrompt } from '@/lib/ai/prompts';
import { z } from 'zod';
import { tavily } from '@tavily/core';
import { createDataStreamResponse, tool } from 'ai';
import { google } from '@ai-sdk/google';
import { cosineDistance, sql, eq, and, gt, desc } from 'drizzle-orm';
import {
    knowledge,
    knowledgeEmbeddings,
    message as dbMessage,
    chat as dbChat,
} from '@/lib/db/schema/app';
import { db } from '@/lib/db';

export const maxDuration = 60;

const tvly = tavily({ apiKey: env.TAVILY_API_KEY });

const openrouter = createOpenRouter({
    apiKey: env.OPENROUTER_API_KEY,
});

const largeModel = openrouter('google/gemini-2.5-flash-preview-05-20');
// const largeModel = openrouter('anthropic/claude-sonnet-4');
// const largeModel = openrouter('google/gemini-2.5-pro-preview');

export async function POST(req: Request) {
    try {
        const { session } = await getUserAuth();
        if (!session?.user) {
            throw new Error('Access Denied');
        }

        const json = await req.json();
        const requestBody = requestBodySchema.parse(json);

        const { message, id, env, webSearch, knowledgeSearch, academicSearch } = requestBody;

        if (!message || !id) {
            throw new Error('Invalid Body');
        }

        const [chat] = await db
            .select()
            .from(dbChat)
            .where(and(eq(dbChat.id, id), eq(dbChat.userId, session.user.id)))
            .limit(1);
        if (!chat) {
            const { object } = await generateObject({
                model: openrouter('google/gemini-2.0-flash-lite-001'),
                schema: z.object({
                    title: z.string().max(100),
                }),
                prompt: `
Given the following query, generate a title for the chat: ${message.content}.
Follow the schema provided.
                    `,
            });

            await api.chat.saveChat.mutate({
                id,
                userId: session.user.id,
                spaceId: env.inSpace ? env.spaceId : undefined,
                title: object.title ?? 'Unnamed Chat',
            });
        }

        const previousMessages = await db.select().from(dbMessage).where(eq(dbMessage.chatId, id));
        const messages = appendClientMessage({
            // @ts-expect-error todo: type conversion from DBMessage[] to UIMessage[]
            messages: previousMessages,
            message,
        });

        await api.chat.saveMessages.mutate({
            messages: [
                {
                    chatId: id,
                    id: message.id,
                    role: 'user',
                    parts: message.parts,
                    attachments: message.experimental_attachments ?? [],
                    createdAt: new Date(),
                },
            ],
        });

        const streamId = generateUUID();

        const activeTools: ('web_search' | 'knowledge_search' | 'academic_search')[] = [];

        if (webSearch) activeTools.push('web_search');
        if (knowledgeSearch) activeTools.push('knowledge_search');
        if (academicSearch) activeTools.push('academic_search');

        const stream = createDataStream({
            execute: (dataStream) => {
                const result = streamText({
                    model: largeModel,
                    messages: convertToCoreMessages(messages),
                    system: AskModePrompt({
                        tools: {
                            webSearch: webSearch ?? false,
                            knowledgeSearch: knowledgeSearch ?? false,
                            academicSearch: academicSearch ?? false,
                        },
                        env,
                    }),
                    maxSteps: 10,
                    experimental_transform: smoothStream({ chunking: 'word', delayInMs: 10 }),
                    experimental_generateMessageId: generateUUID,
                    onFinish: async ({ response }) => {
                        if (session.user?.id) {
                            try {
                                const assistantId = getTrailingMessageId({
                                    messages: response.messages.filter(
                                        (message) => message.role === 'assistant'
                                    ),
                                });

                                if (!assistantId) {
                                    throw new Error('No assistant message found.');
                                }

                                const [_, assistantMessage] = appendResponseMessages({
                                    messages: [message],
                                    responseMessages: response.messages,
                                });

                                await api.chat.saveMessages.mutate({
                                    messages: [
                                        {
                                            id: assistantId,
                                            chatId: id,
                                            role: assistantMessage.role,
                                            parts: assistantMessage.parts,
                                            attachments:
                                                assistantMessage.experimental_attachments ?? [],
                                            createdAt: new Date(),
                                        },
                                    ],
                                });
                            } catch (_) {
                                console.error('Failed to save the chat.');
                            }
                        }
                    },
                    toolCallStreaming: true,
                    experimental_activeTools: activeTools,
                    tools: {
                        web_search: tool({
                            description: 'Performs a search over the internet for current data.',
                            parameters: z.object({
                                web_search_queries: z.array(z.string()).max(5),
                            }),
                            execute: async ({ web_search_queries: queries }, { toolCallId }) => {
                                dataStream.writeMessageAnnotation({
                                    type: 'tool-call',
                                    data: {
                                        toolCallId,
                                        toolName: 'web_search',
                                        state: 'call',
                                        args: JSON.stringify({ web_search_queries: queries }),
                                    },
                                });

                                console.log('Web Search Queries: ', queries);

                                type SearchGroup = {
                                    query: string;
                                    results: {
                                        url: string;
                                        title: string;
                                        content: string;
                                        raw_content: string;
                                        published_date: string | null;
                                    }[];
                                };

                                const searchPromises: Promise<SearchGroup>[] = queries.map(
                                    async (query: string) => {
                                        const res = await tvly.search(query, {
                                            maxResults: 5,
                                            searchDepth: 'advanced',
                                            includeAnswer: true,
                                        });

                                        return {
                                            query,
                                            results: deduplicateByDomainAndUrl(res.results).map(
                                                (obj: any) => ({
                                                    url: obj.url,
                                                    title: obj.title,
                                                    content: obj.content,
                                                    raw_content: obj.raw_content,
                                                    published_date: obj.published_date,
                                                })
                                            ),
                                        };
                                    }
                                );

                                const searchResults = await Promise.all(searchPromises);

                                dataStream.writeMessageAnnotation({
                                    type: 'tool-call',
                                    data: {
                                        toolCallId,
                                        toolName: 'web_search',
                                        state: 'result',
                                        args: JSON.stringify({ web_search_queries: queries }),
                                        result: JSON.stringify({ searches: searchResults }),
                                    },
                                });
                                return {
                                    searches: searchResults,
                                };
                            },
                        }),
                        knowledge_search: tool({
                            description:
                                'Performs an Internal Semantic Search on User Uploaded Documents.',
                            parameters: z.object({
                                knowledge_search_keywords: z.array(z.string()).max(5),
                            }),
                            execute: async (
                                { knowledge_search_keywords: keywords },
                                { toolCallId }
                            ) => {
                                if (!env.inSpace) {
                                    return null;
                                }

                                dataStream.writeMessageAnnotation({
                                    type: 'tool-call',
                                    data: {
                                        toolCallId,
                                        toolName: 'knowledge_search',
                                        state: 'call',
                                        args: JSON.stringify(keywords),
                                    },
                                });

                                console.log('Knowledge Search Keywords: ', keywords);

                                const { embeddings } = await embedMany({
                                    model: google.textEmbeddingModel('text-embedding-004'),
                                    values: keywords,
                                });

                                const Promises = embeddings.map(
                                    async (embedding: (typeof embeddings)[0], index: number) => {
                                        const similarity = sql<number>`1 - (${cosineDistance(knowledgeEmbeddings.embedding, embedding)})`;

                                        const contexts = await db
                                            .select({
                                                content: knowledgeEmbeddings.content,
                                                embedding: knowledgeEmbeddings.embedding,
                                                knowledgeName: knowledge.knowledgeName,
                                                similarity,
                                            })
                                            .from(knowledge)
                                            .fullJoin(
                                                knowledgeEmbeddings,
                                                eq(knowledge.id, knowledgeEmbeddings.knowledgeId)
                                            )
                                            .where(
                                                and(
                                                    and(
                                                        eq(knowledge.userId, session.user.id),
                                                        eq(knowledge.spaceId, env.spaceId!)
                                                    ),
                                                    gt(similarity, 0.5)
                                                )
                                            )
                                            .orderBy((t) => desc(t.similarity))
                                            .limit(10);

                                        return {
                                            keyword: keywords[index],
                                            contexts: contexts.map(
                                                ({ embedding, ...rest }) => rest
                                            ),
                                        };
                                    }
                                );

                                const results = await Promise.all(Promises);

                                dataStream.writeMessageAnnotation({
                                    type: 'tool-call',
                                    data: {
                                        toolCallId,
                                        toolName: 'knowledge_search',
                                        state: 'result',
                                        args: JSON.stringify({ keywords }),
                                        result: JSON.stringify({ results }),
                                    },
                                });

                                return {
                                    results,
                                };
                            },
                        }),
                        academic_search: tool({
                            description:
                                'Performs a search for various academic papers and researches',
                            parameters: z.object({
                                academic_search_queries: z.array(z.string()).max(5),
                            }),
                            execute: async (
                                { academic_search_queries: queries },
                                { toolCallId }
                            ) => {
                                dataStream.writeMessageAnnotation({
                                    type: 'tool-call',
                                    data: {
                                        toolCallId,
                                        toolName: 'academic_search',
                                        state: 'call',
                                        args: JSON.stringify(queries),
                                    },
                                });

                                console.log('Academic Search Queries: ', queries);

                                // TODO
                                return null;
                            },
                        }),
                    },
                });

                result.consumeStream();
                result.mergeIntoDataStream(dataStream, {
                    sendReasoning: true,
                });
            },
            onError: () => {
                return 'Oops, an error occurred while processing your request.';
            },
        });

        return new Response(stream);
    } catch (error) {
        console.error(error);
        return new Response((error as Error).message, { status: 500 });
    }
}

const extractDomain = (url: string): string => {
    const urlPattern = /^https?:\/\/([^/?#]+)(?:[/?#]|$)/i;
    return url.match(urlPattern)?.[1] || url;
};

const deduplicateByDomainAndUrl = <T extends { url: string }>(items: T[]): T[] => {
    const seenDomains = new Set<string>();
    const seenUrls = new Set<string>();

    return items.filter((item) => {
        const domain = extractDomain(item.url);
        const isNewUrl = !seenUrls.has(item.url);
        const isNewDomain = !seenDomains.has(domain);

        if (isNewUrl && isNewDomain) {
            seenUrls.add(item.url);
            seenDomains.add(domain);
            return true;
        }
        return false;
    });
};

const requestBodySchema = z.object({
    id: z.string().uuid(),
    env: z.object({
        inSpace: z.boolean(),
        spaceId: z.string().uuid().optional(),
        spaceName: z.string().optional(),
        spaceDescription: z.string().optional(),
    }),
    message: z.object({
        id: z.string().uuid(),
        createdAt: z.coerce.date(),
        role: z.enum(['user']),
        content: z.string().min(1).max(2000),
        parts: z.array(
            z.object({
                text: z.string().min(1).max(2000),
                type: z.enum(['text']),
            })
        ),
        experimental_attachments: z
            .array(
                z.object({
                    url: z.string().url(),
                    name: z.string().min(1).max(2000),
                    contentType: z.enum(['image/png', 'image/jpeg', 'image/jpg']),
                })
            )
            .optional()
            .default([]),
    }),
    webSearch: z.boolean().optional(),
    knowledgeSearch: z.boolean().optional(),
    academicSearch: z.boolean().optional(),
});
