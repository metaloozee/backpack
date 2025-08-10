import {
    convertToModelMessages,
    smoothStream,
    streamText,
    generateObject,
    stepCountIs,
    createUIMessageStream,
    JsonToSseTransformStream,
    LanguageModel,
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
import { financeSearchTool } from '@/lib/ai/tools/financeSearch';
import { newsSearchTool } from '@/lib/ai/tools/newsSearch';

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
                financeSearch,
                newsSearch,
            } = requestBody;

            console.log({
                webSearch,
                knowledgeSearch,
                academicSearch,
                financeSearch,
                newsSearch,
            });

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

            const stream = createUIMessageStream({
                execute: ({ writer: dataStream }) => {
                    const result = streamText({
                        model: model.instance as LanguageModel,
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
                                financeSearch: financeSearch ?? false,
                                newsSearch: newsSearch ?? false,
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
                            finance_search: financeSearchTool({ dataStream }),
                            news_search: newsSearchTool({ dataStream }),
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

export const getStreamContext = () => {
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
    financeSearch: z.boolean().optional(),
    newsSearch: z.boolean().optional(),
});
