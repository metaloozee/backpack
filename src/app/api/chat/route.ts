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
import { generateUUID, getTrailingMessageId } from '@/lib/ai/utils';
import { sanitizeUserInput, sanitizeFileName } from '@/lib/utils/sanitization';
import {
    handleApiError,
    safeDbOperation,
    safeExternalOperation,
    UnauthorizedError,
    NotFoundError,
    ValidationError,
    DatabaseError,
} from '@/lib/utils/error-handling';

import { env } from '@/lib/env.mjs';

import { caller } from '@/lib/trpc/server';
import { AskModePrompt } from '@/lib/ai/prompts';
import { z } from 'zod';
import { tavily } from '@tavily/core';
import { tool } from 'ai';
import { createResumableStreamContext, type ResumableStreamContext } from 'resumable-stream';
import { cosineDistance, sql, eq, and, gt, desc, asc } from 'drizzle-orm';
import {
    knowledge,
    knowledgeEmbeddings,
    message as dbMessage,
    chat as dbChat,
    stream as dbStream,
    memories as dbMemories,
} from '@/lib/db/schema/app';
import { db } from '@/lib/db';
import { differenceInSeconds } from 'date-fns';

import { after, NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getModel } from '@/lib/ai/models';
import { getSession } from '@/lib/auth/utils';

import { google, GoogleGenerativeAIProviderOptions } from '@ai-sdk/google';
import { AnthropicProviderOptions } from '@ai-sdk/anthropic';

export const maxDuration = 60;

const tvly = tavily({ apiKey: env.TAVILY_API_KEY });

let globalStreamContext: ResumableStreamContext | null = null;

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            throw new UnauthorizedError('Access denied');
        }

        const json = await req.json();
        const requestBody = requestBodySchema.parse(json);

        const { message, id, env, webSearch, knowledgeSearch, academicSearch } = requestBody;

        if (!message || !id) {
            throw new ValidationError('Message and ID are required');
        }

        const sanitizedMessage = {
            ...message,
            content: sanitizeUserInput(message.content),
            parts: message.parts.map((part) => ({
                ...part,
                text: sanitizeUserInput(part.text),
            })),
            experimental_attachments: message.experimental_attachments?.map((attachment) => ({
                ...attachment,
                name: sanitizeFileName(attachment.name),
            })),
        };

        const cookieStore = await cookies();
        const modelId = cookieStore.get('X-Model-Id')?.value ?? 'gemini-2.5-flash';
        const model = getModel(modelId);

        if (!model) {
            throw new ValidationError('Invalid model selected');
        }

        const [chat] = await safeDbOperation(
            () =>
                db
                    .select()
                    .from(dbChat)
                    .where(and(eq(dbChat.id, id), eq(dbChat.userId, session.userId)))
                    .limit(1),
            'Failed to retrieve chat'
        );
        if (!chat) {
            const { object } = await safeExternalOperation(
                () =>
                    generateObject({
                        model: google('gemini-2.5-flash-lite'),
                        schema: z.object({
                            title: z.string().max(100),
                        }),
                        prompt: `
Given the following query, generate a title for the chat: ${sanitizedMessage.content}.
Follow the schema provided.
                        `,
                    }),
                'Failed to generate chat title'
            );

            await safeDbOperation(
                () =>
                    caller.chat.saveChat({
                        id,
                        userId: session.userId,
                        spaceId: env.inSpace ? env.spaceId : undefined,
                        title: object.title ?? 'Unnamed Chat',
                    }),
                'Failed to save chat'
            );
        }

        const previousMessages = await safeDbOperation(
            () => db.select().from(dbMessage).where(eq(dbMessage.chatId, id)),
            'Failed to retrieve previous messages'
        );

        const userMemories = await safeDbOperation(
            () =>
                db
                    .select({ content: dbMemories.content, createdAt: dbMemories.createdAt })
                    .from(dbMemories)
                    .where(eq(dbMemories.userId, session.userId))
                    .orderBy(desc(dbMemories.createdAt)),
            'Failed to retrieve user memories'
        );

        const messages = appendClientMessage({
            messages: previousMessages.map((msg) => ({
                id: msg.id,
                role: msg.role as 'user' | 'assistant' | 'system',
                parts: msg.parts as { text: string; type: 'text' }[],
                content: '',
                experimental_attachments: msg.attachments as {
                    url: string;
                    name: string;
                    contentType: string;
                }[],
                createdAt: msg.createdAt,
            })),
            message: sanitizedMessage,
        });

        await safeDbOperation(
            () =>
                caller.chat.saveMessages({
                    messages: [
                        {
                            chatId: id,
                            id: sanitizedMessage.id,
                            role: 'user',
                            parts: sanitizedMessage.parts,
                            attachments: sanitizedMessage.experimental_attachments ?? [],
                            createdAt: new Date(),
                        },
                    ],
                }),
            'Failed to save user message'
        );

        const streamId = generateUUID();
        await safeDbOperation(
            () => db.insert(dbStream).values({ id: streamId, chatId: id, createdAt: new Date() }),
            'Failed to create stream'
        );

        const activeTools: ('web_search' | 'knowledge_search' | 'academic_search')[] = [];

        if (webSearch) activeTools.push('web_search');
        if (knowledgeSearch) activeTools.push('knowledge_search');
        if (academicSearch) activeTools.push('academic_search');

        const stream = createDataStream({
            execute: (dataStream) => {
                const result = streamText({
                    model: model.instance,
                    providerOptions: model.properties?.includes('reasoning')
                        ? {
                              anthropic: {
                                  thinking: {
                                      type: 'enabled',
                                      budgetTokens: 2048,
                                  },
                              } satisfies AnthropicProviderOptions,
                              google: {
                                  thinkingConfig: {
                                      thinkingBudget: 2048,
                                      includeThoughts: true,
                                  },
                              } satisfies GoogleGenerativeAIProviderOptions,
                          }
                        : {},
                    messages: convertToCoreMessages(messages),
                    system: AskModePrompt({
                        tools: {
                            webSearch: webSearch ?? false,
                            knowledgeSearch: knowledgeSearch ?? false,
                            academicSearch: academicSearch ?? false,
                        },
                        env: {
                            ...env,
                            memories: userMemories,
                        },
                    }),
                    onError: (error) => {
                        console.error(error);
                    },
                    maxSteps: 10,
                    experimental_transform: smoothStream({ chunking: 'word', delayInMs: 10 }),
                    experimental_generateMessageId: generateUUID,
                    onFinish: async ({ response }) => {
                        if (session.userId) {
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
                                    messages: [sanitizedMessage],
                                    responseMessages: response.messages,
                                });

                                await caller.chat.saveMessages({
                                    messages: [
                                        {
                                            id: assistantId,
                                            chatId: id,
                                            role: assistantMessage.role,
                                            parts: assistantMessage.parts ?? [],
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
                    experimental_activeTools: ['extract', 'save_to_memories', ...activeTools],
                    tools: {
                        save_to_memories: tool({
                            description: 'Save the information about the user to their memories.',
                            parameters: z.object({
                                contents: z.array(z.string()).min(1).max(5),
                            }),
                            execute: async ({ contents }, { toolCallId }) => {
                                dataStream.writeMessageAnnotation({
                                    type: 'tool-call',
                                    data: {
                                        toolCallId,
                                        toolName: 'save_to_memories',
                                        state: 'call',
                                        args: JSON.stringify({ contents }),
                                    },
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

                                        const similarity = sql<number>`1 - (${cosineDistance(dbMemories.embedding, embedding)})`;

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
                                        await safeDbOperation(
                                            () => db.insert(dbMemories).values(newMemories),
                                            'Failed to save memories'
                                        );
                                        savedCount = newMemories.length;
                                    }

                                    const result = {
                                        saved_count: savedCount,
                                        total_count: contents.length,
                                    };

                                    dataStream.writeMessageAnnotation({
                                        type: 'tool-call',
                                        data: {
                                            toolCallId,
                                            toolName: 'save_to_memories',
                                            state: 'result',
                                            args: JSON.stringify({ contents }),
                                            result: JSON.stringify(result),
                                        },
                                    });

                                    return result;
                                } catch (error) {
                                    console.error('Error saving memories:', error);
                                    throw new Error('Failed to save memories');
                                }
                            },
                        }),
                        extract: tool({
                            description:
                                'Extract web page content from one or more specified URLs.',
                            parameters: z.object({
                                urls: z.array(z.string()),
                            }),
                            execute: async ({ urls }, { toolCallId }) => {
                                dataStream.writeMessageAnnotation({
                                    type: 'tool-call',
                                    data: {
                                        toolCallId,
                                        toolName: 'extract',
                                        state: 'call',
                                        args: JSON.stringify({ urls }),
                                    },
                                });

                                console.log('Extracting URLs: ', urls);

                                const res = await tvly.extract(urls, { extractDepth: 'advanced' });

                                type ExtractResult = {
                                    url: string;
                                    images: string[] | undefined;
                                    content: string;
                                };

                                const results: ExtractResult[] = res.results.map((result) => ({
                                    url: result.url,
                                    images: result.images,
                                    content: result.rawContent,
                                }));

                                dataStream.writeMessageAnnotation({
                                    type: 'tool-call',
                                    data: {
                                        toolCallId,
                                        toolName: 'extract',
                                        state: 'result',
                                        args: JSON.stringify({ urls }),
                                        result: JSON.stringify({ results }),
                                    },
                                });

                                return res.results.map((result) => ({
                                    url: result.url,
                                    content: result.rawContent,
                                }));
                            },
                        }),
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
                                                knowledgeName: knowledge.knowledgeName,
                                                knowledgeType: knowledge.knowledgeType,
                                                similarity,
                                            })
                                            .from(knowledgeEmbeddings)
                                            .innerJoin(
                                                knowledge,
                                                eq(knowledgeEmbeddings.knowledgeId, knowledge.id)
                                            )
                                            .where(
                                                and(
                                                    eq(knowledge.userId, session.userId),
                                                    eq(knowledge.spaceId, env.spaceId!),
                                                    gt(similarity, 0.5)
                                                )
                                            )
                                            .orderBy(desc(similarity))
                                            .limit(10);

                                        return {
                                            keyword: keywords[index],
                                            contexts,
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

        const streamContext = getStreamContext();
        if (streamContext) {
            return new Response(await streamContext.resumableStream(streamId, () => stream));
        } else {
            return new Response(stream);
        }
    } catch (error) {
        return handleApiError(error);
    }
}

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            throw new UnauthorizedError('Access denied');
        }

        const streamContext = getStreamContext();
        const resumeRequestedAt = new Date();

        if (!streamContext) {
            throw new DatabaseError('Stream context not found');
        }

        const { searchParams } = new URL(request.url);
        const chatId = searchParams.get('chatId');

        if (!chatId) {
            throw new ValidationError('Chat ID is required');
        }

        // Single query to verify chat ownership and get streams
        const chatWithStreams = await safeDbOperation(
            () =>
                db
                    .select({
                        chatId: dbChat.id,
                        streamId: dbStream.id,
                        streamCreatedAt: dbStream.createdAt,
                    })
                    .from(dbChat)
                    .leftJoin(dbStream, eq(dbChat.id, dbStream.chatId))
                    .where(and(eq(dbChat.id, chatId), eq(dbChat.userId, session.userId)))
                    .orderBy(asc(dbStream.createdAt)),
            'Failed to retrieve chat and streams'
        );

        if (!chatWithStreams.length || !chatWithStreams[0].chatId) {
            throw new NotFoundError('Chat not found');
        }

        const streamIds = chatWithStreams
            .filter((item) => item.streamId)
            .map((item) => item.streamId!);

        if (!streamIds.length) {
            throw new NotFoundError('No streams found');
        }

        const recentStreamId = streamIds[streamIds.length - 1];
        if (!recentStreamId) {
            throw new NotFoundError('No recent stream found');
        }

        const emptyDataStream = createDataStream({
            execute: () => {},
        });

        const stream = await streamContext.resumableStream(recentStreamId, () => emptyDataStream);
        if (!stream) {
            const messages = await db
                .select()
                .from(dbMessage)
                .where(eq(dbMessage.chatId, chatId))
                .orderBy(asc(dbMessage.createdAt));
            const mostRecentMessage = messages[messages.length - 1];
            if (!mostRecentMessage) {
                return new Response(emptyDataStream, { status: 200 });
            }

            if (mostRecentMessage.role !== 'assistant') {
                return new Response(emptyDataStream, { status: 200 });
            }

            const messageCreatedAt = new Date(mostRecentMessage.createdAt);
            if (differenceInSeconds(resumeRequestedAt, messageCreatedAt) > 15) {
                return new Response(emptyDataStream, { status: 200 });
            }

            const restoredStream = createDataStream({
                execute: (buffer) => {
                    buffer.writeData({
                        type: 'append-message',
                        message: JSON.stringify(mostRecentMessage),
                    });
                },
            });

            return new Response(restoredStream, { status: 200 });
        }

        return new Response(stream, { status: 200 });
    } catch (error) {
        return handleApiError(error);
    }
}

const getStreamContext = () => {
    if (!globalStreamContext) {
        try {
            globalStreamContext = createResumableStreamContext({
                waitUntil: after,
            });
        } catch (error: any) {
            console.error(error);
        }
    }

    return globalStreamContext;
};

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
