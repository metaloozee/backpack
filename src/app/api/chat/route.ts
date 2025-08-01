import {
    convertToModelMessages,
    smoothStream,
    streamText,
    generateObject,
    stepCountIs,
    createUIMessageStream,
    JsonToSseTransformStream,
} from 'ai';
import { generateUUID, getTrailingMessageId, convertToUIMessages } from '@/lib/ai/utils';

import { caller } from '@/lib/trpc/server';
import { AskModePrompt } from '@/lib/ai/prompts';
import { z } from 'zod';
import { createResumableStreamContext, type ResumableStreamContext } from 'resumable-stream';
import { sql, eq, and, gt, desc, asc } from 'drizzle-orm';
import {
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

import { saveToMemoriesTool } from '@/lib/ai/tools/saveToMemories';
import { extractTool } from '@/lib/ai/tools/extract';
import { webSearchTool } from '@/lib/ai/tools/webSearch';
import { knowledgeSearchTool } from '@/lib/ai/tools/knowledgeSearch';
import { academicSearchTool } from '@/lib/ai/tools/academicSearch';

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            throw new Error('Access denied');
        }

        const json = await req.json();
        const requestBody = requestBodySchema.parse(json);

        try {
            const {
                message,
                id,
                env: requestEnv,
                webSearch,
                knowledgeSearch,
                academicSearch,
            } = requestBody;

            if (!message || !id) {
                throw new Error('Message and ID are required');
            }

            const cookieStore = await cookies();
            const modelId = cookieStore.get('X-Model-Id')?.value ?? 'gemini-2.5-flash';
            const model = getModel(modelId);

            if (!model) {
                throw new Error('Invalid model selected');
            }

            const [chat] = await db
                .select()
                .from(dbChat)
                .where(and(eq(dbChat.id, id), eq(dbChat.userId, session.userId)))
                .limit(1);

            if (!chat) {
                const { object } = await generateObject({
                    model: google('gemini-2.5-flash-lite'),
                    schema: z.object({
                        title: z.string().max(100),
                    }),
                    prompt: `
    Given the following query, generate a title for the chat: ${JSON.stringify(message)}.
    Follow the schema provided.
                            `,
                });

                await caller.chat.saveChat({
                    id,
                    userId: session.userId,
                    spaceId: requestEnv.inSpace ? requestEnv.spaceId : undefined,
                    title: object.title ?? 'Unnamed Chat',
                });
            }

            const previousMessages = await db
                .select()
                .from(dbMessage)
                .where(eq(dbMessage.chatId, id));

            const userMemories = await db
                .select({ content: dbMemories.content, createdAt: dbMemories.createdAt })
                .from(dbMemories)
                .where(eq(dbMemories.userId, session.userId))
                .orderBy(desc(dbMemories.createdAt));

            const uiMessages = [...convertToUIMessages(previousMessages), message];

            await caller.chat.saveMessages({
                messages: [
                    {
                        chatId: id,
                        id: message.id,
                        role: 'user',
                        parts: message.parts,
                        attachments: [],
                        createdAt: new Date(),
                    },
                ],
            });

            const streamId = generateUUID();
            await db.insert(dbStream).values({ id: streamId, chatId: id, createdAt: new Date() });

            const activeTools: ('web_search' | 'knowledge_search' | 'academic_search')[] = [];

            if (webSearch) activeTools.push('web_search');
            if (knowledgeSearch) activeTools.push('knowledge_search');
            if (academicSearch) activeTools.push('academic_search');

            const stream = createUIMessageStream({
                execute: ({ writer: dataStream }) => {
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
                        messages: convertToModelMessages(uiMessages),
                        system: AskModePrompt({
                            tools: {
                                webSearch: webSearch ?? false,
                                knowledgeSearch: knowledgeSearch ?? false,
                                academicSearch: academicSearch ?? false,
                            },
                            env: {
                                ...requestEnv,
                                memories: userMemories,
                            },
                        }),
                        stopWhen: stepCountIs(10),
                        experimental_transform: smoothStream({ chunking: 'word', delayInMs: 10 }),
                        onError: (error) => {
                            console.error(error);
                        },
                        tools: {
                            save_to_memories: saveToMemoriesTool({ session, dataStream }),
                            extract: extractTool({ session, dataStream }),
                            web_search: webSearchTool({ session, dataStream }),
                            knowledge_search: knowledgeSearchTool({
                                session,
                                dataStream,
                                env: requestEnv,
                            }),
                            academic_search: academicSearchTool({ session, dataStream }),
                        },
                    });

                    result.consumeStream();
                    dataStream.merge(result.toUIMessageStream({ sendReasoning: true }));
                },
                generateId: generateUUID,
                onError: () => {
                    return 'Oops, an error occurred while processing your request.';
                },
                onFinish: async ({ messages }) => {
                    await caller.chat.saveMessages({
                        messages: messages.map((message) => ({
                            id: message.id,
                            role: message.role,
                            parts: message.parts,
                            createdAt: new Date(),
                            attachments: [],
                            chatId: id,
                        })),
                    });
                },
            });

            const streamContext = getStreamContext();
            if (streamContext) {
                return new Response(
                    await streamContext.resumableStream(streamId, () =>
                        stream.pipeThrough(new JsonToSseTransformStream())
                    )
                );
            } else {
                return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
            }
        } catch (error) {
            console.error(error);
            return new Response(JSON.stringify({ code: 'INTERNAL_SERVER_ERROR', cause: error }), {
                status: 500,
            });
        }
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ code: 'INTERNAL_SERVER_ERROR', cause: error }), {
            status: 500,
        });
    }
}

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            throw new Error('Access denied');
        }

        const streamContext = getStreamContext();
        const resumeRequestedAt = new Date();

        if (!streamContext) {
            throw new Error('Stream context not found');
        }

        const { searchParams } = new URL(request.url);
        const chatId = searchParams.get('chatId');

        if (!chatId) {
            throw new Error('Chat ID is required');
        }

        const chatWithStreams = await db
            .select({
                chatId: dbChat.id,
                streamId: dbStream.id,
                streamCreatedAt: dbStream.createdAt,
            })
            .from(dbChat)
            .leftJoin(dbStream, eq(dbChat.id, dbStream.chatId))
            .where(and(eq(dbChat.id, chatId), eq(dbChat.userId, session.userId)))
            .orderBy(asc(dbStream.createdAt));

        if (!chatWithStreams.length || !chatWithStreams[0].chatId) {
            throw new Error('Chat not found');
        }

        const streamIds = chatWithStreams
            .filter((item) => item.streamId)
            .map((item) => item.streamId!);

        if (!streamIds.length) {
            throw new Error('No streams found');
        }

        const recentStreamId = streamIds[streamIds.length - 1];
        if (!recentStreamId) {
            throw new Error('No recent stream found');
        }

        const emptyDataStream = createUIMessageStream({
            execute: () => {},
        });

        const stream = await streamContext.resumableStream(recentStreamId, () =>
            emptyDataStream.pipeThrough(new JsonToSseTransformStream())
        );
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

            const restoredStream = createUIMessageStream({
                execute: ({ writer }) => {
                    writer.write({
                        type: 'data-appendMessage',
                        data: JSON.stringify(mostRecentMessage),
                        transient: true,
                    });
                },
            });

            return new Response(restoredStream.pipeThrough(new JsonToSseTransformStream()), {
                status: 200,
            });
        }

        return new Response(stream.pipeThrough(new JsonToSseTransformStream()), { status: 200 });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ code: 'INTERNAL_SERVER_ERROR', cause: error }), {
            status: 500,
        });
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

const textPartSchema = z.object({
    type: z.enum(['text']),
    text: z.string().min(1).max(2000),
});

const filePartSchema = z.object({
    type: z.enum(['file']),
    mediaType: z.enum(['image/jpeg', 'image/png']),
    name: z.string().min(1).max(100),
    url: z.string().url(),
});

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
        role: z.enum(['user']),
        parts: z.array(z.union([textPartSchema, filePartSchema])),
    }),
    webSearch: z.boolean().optional(),
    knowledgeSearch: z.boolean().optional(),
    academicSearch: z.boolean().optional(),
});
