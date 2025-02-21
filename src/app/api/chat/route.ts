import {
    convertToCoreMessages,
    smoothStream,
    Message,
    streamText,
    appendResponseMessages,
} from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

import { env } from '@/lib/env.mjs';

import { getUserAuth } from '@/lib/auth/utils';
import { api } from '@/lib/trpc/api';
import { WebPrompt } from '@/lib/ai/prompts';
import { object, z } from 'zod';
import { tavily } from '@tavily/core';
import { createDataStreamResponse, tool } from 'ai';

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

        const { messages, id: chatId, spaceId } = await req.json();
        if (!messages || !chatId) {
            throw new Error('Invalid Body');
        }

        return createDataStreamResponse({
            async execute(dataStream) {
                const result = streamText({
                    model: openrouter('google/gemini-2.0-flash-001'),
                    messages: convertToCoreMessages(messages),
                    system: WebPrompt(),
                    maxSteps: 10,
                    experimental_transform: smoothStream(),
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
                    experimental_activeTools: ['web_search'],
                    tools: {
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
                                            maxResults: 3,
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
                        search_knowledge: tool({
                            description: '',
                            parameters: z.object({
                                keywords: z.array(z.string()),
                            }),
                            execute: async ({ keywords }, { toolCallId }) => {
                                console.log('Keywords: ', keywords);

                                return null;
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
        return new Response('Error', { status: 500 });
    }
}
