import {
    convertToCoreMessages,
    smoothStream,
    Message,
    streamText,
    appendResponseMessages,
    embed,
    embedMany,
    generateObject,
} from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

import { env } from '@/lib/env.mjs';

import { getUserAuth } from '@/lib/auth/utils';
import { api } from '@/lib/trpc/api';
import { Prompt, WebPrompt } from '@/lib/ai/prompts';
import { object, z } from 'zod';
import { tavily } from '@tavily/core';
import { createDataStreamResponse, tool } from 'ai';
import { google } from '@ai-sdk/google';
import { cosineDistance, sql, eq, and, gt, desc } from 'drizzle-orm';
import { knowledge, knowledgeEmbeddings } from '@/lib/db/schema/app';
import { db } from '@/lib/db';

export const maxDuration = 60;

const tvly = tavily({ apiKey: env.TAVILY_API_KEY });

const openrouter = createOpenRouter({
    apiKey: env.OPENROUTER_API_KEY,
});

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

export async function POST(req: Request) {
    try {
        const { session } = await getUserAuth();
        if (!session) {
            throw new Error('Access Denied');
        }

        const {
            messages,
            id: chatId,
            spaceId,
            webSearch,
            knowledgeSearch: searchKnowledge,
        } = await req.json();
        if (!messages || !chatId) {
            throw new Error('Invalid Body');
        }

        if (!webSearch && !searchKnowledge) {
            throw new Error('You must be using at-least one tool');
        }

        return createDataStreamResponse({
            async execute(dataStream) {
                const result = streamText({
                    model: openrouter('google/gemini-2.0-flash-001'),
                    messages: convertToCoreMessages(messages),
                    system: Prompt({
                        webSearch,
                        searchKnowledge: true,
                        xSearch: false,
                        academicSearch: false,
                    }),
                    maxSteps: 20,
                    experimental_transform: smoothStream({
                        chunking: 'word',
                        delayInMs: 10,
                    }),
                    toolCallStreaming: true,
                    async onFinish({ response }) {
                        try {
                            await api.chat.saveChat.mutate({
                                chat: {
                                    id: chatId,
                                    userId: session.user.id,
                                    spaceId: spaceId,
                                    chatName: convertToCoreMessages(messages)[0].content.toString(),
                                    messages: [
                                        ...convertToCoreMessages(messages),
                                        ...response.messages,
                                    ],
                                },
                            });
                        } catch (error) {}
                    },
                    experimental_activeTools: [
                        'reason',
                        webSearch && webSearch === true && 'web_search',
                        searchKnowledge && searchKnowledge === true && 'search_knowledge',
                    ],
                    tools: {
                        reason: tool({
                            description:
                                'Generates a research plan with multiple steps and analysis',
                            parameters: z.object({
                                topic: z
                                    .string()
                                    .describe(
                                        'The main topic or question to generate a research plan.'
                                    ),
                            }),
                            execute: async ({ topic }, { toolCallId }) => {
                                console.log('Reasoning...');

                                dataStream.writeMessageAnnotation({
                                    type: 'tool-call',
                                    data: {
                                        toolCallId,
                                        toolName: 'reason',
                                        state: 'call',
                                        args: JSON.stringify(topic),
                                    },
                                });

                                try {
                                    const { object: researchPlan } = await generateObject({
                                        model: openrouter(
                                            'google/gemini-2.0-flash-thinking-exp:free'
                                        ),
                                        schema: z.object({
                                            web_search_queries: z.array(z.string()).max(5),
                                            knowledge_search_keywords: z.array(z.string()).max(5),
                                            x_search_query: z.string(),
                                            academic_search_queries: z.array(z.string()).max(5),
                                            research_analysis: z
                                                .string()
                                                .describe(
                                                    'The final analysis to perform on the results retrieved from tools.'
                                                ),
                                        }),
                                        prompt: `
    You are a tool acting as a specialized researcher trained on special researching techniques and queries.
    Your job is to create a focused research plan for the topic: "${topic}".
    
    Today's date and day of the week: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
    
    Consider different angles and potential controversies, but maintain focus on the core aspects.
                                        `,
                                    });

                                    dataStream.writeMessageAnnotation({
                                        type: 'tool-call',
                                        data: {
                                            toolCallId,
                                            toolName: 'reason',
                                            state: 'result',
                                            args: JSON.stringify({ topic }),
                                            result: JSON.stringify({ researchPlan }),
                                        },
                                    });

                                    console.log(researchPlan);

                                    return researchPlan;
                                } catch (e) {
                                    console.error(e);
                                }
                            },
                        }),
                        web_search: tool({
                            description: 'Performs a search over the internet for current data.',
                            parameters: z.object({
                                queries: z.array(z.string()),
                            }),
                            execute: async ({ queries }, { toolCallId }) => {
                                dataStream.writeMessageAnnotation({
                                    type: 'tool-call',
                                    data: {
                                        toolCallId,
                                        toolName: 'web_search',
                                        state: 'call',
                                        args: JSON.stringify(queries),
                                    },
                                });

                                console.log('Queries: ', queries);

                                const searchPromises = queries.map(
                                    async (query: string, index: number) => {
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
                                const processedResults = searchResults.map((r) => r.results).flat();

                                dataStream.writeMessageAnnotation({
                                    type: 'tool-call',
                                    data: {
                                        toolCallId,
                                        toolName: 'web_search',
                                        state: 'result',
                                        args: JSON.stringify({ queries }),
                                        result: JSON.stringify({ processedResults }),
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
                                keywords: z.array(z.string()),
                            }),
                            execute: async ({ keywords }, { toolCallId }) => {
                                if (!spaceId) {
                                    return null;
                                }

                                dataStream.writeMessageAnnotation({
                                    type: 'tool-call',
                                    data: {
                                        toolCallId,
                                        toolName: 'search_knowledge',
                                        state: 'call',
                                        args: JSON.stringify(keywords),
                                    },
                                });

                                console.log('Keywords: ', keywords);

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
                                                        eq(knowledge.spaceId, spaceId)
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
                                        toolName: 'search_knowledge',
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
                    },
                });

                result.consumeStream();

                return result.mergeIntoDataStream(dataStream);
            },
        });
    } catch (error) {
        console.error(error);
        return new Response((error as Error).message, { status: 500 });
    }
}
