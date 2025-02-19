import { convertToCoreMessages, smoothStream, streamText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

import { env } from '@/lib/env.mjs';

import { getUserAuth } from '@/lib/auth/utils';
import { api } from '@/lib/trpc/api';
import { WebPrompt } from '@/lib/ai/prompts';
import { object, z } from 'zod';
import { tavily } from '@tavily/core';
import { createDataStreamResponse } from 'ai';

export const maxDuration = 30;

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

        const result = streamText({
            model: openrouter('google/gemini-2.0-flash-001'),
            messages: convertToCoreMessages(messages).filter(
                (message) => message.content.length > 0
            ),
            system: WebPrompt(),
            experimental_transform: smoothStream(),
            toolCallStreaming: true,
            maxSteps: 10,
            async onFinish({ response }) {
                try {
                    await api.chat.saveChat.mutate({
                        chat: {
                            id: chatId,
                            userId: session.user.id,
                            spaceId: spaceId,
                            chatName: convertToCoreMessages(messages)[0].content.toString(),
                            messages: [...convertToCoreMessages(messages), ...response.messages],
                        },
                    });
                } catch (error) {}
            },
            tools: {
                web_search: {
                    description: 'Performs a search over the internet for current data.',
                    parameters: z.object({
                        queries: z.array(z.string()),
                    }),
                    execute: async ({ queries }) => {
                        console.log('Queries: ', queries);

                        const searchPromises = queries.map(async (query: string, index: number) => {
                            const res = await tvly.search(query, {
                                maxResults: 10,
                                searchDepth: 'advanced',
                                includeAnswer: true,
                            });

                            return {
                                query,
                                results: deduplicateByDomainAndUrl(res.results).map((obj: any) => ({
                                    url: obj.url,
                                    title: obj.title,
                                    content: obj.content,
                                    raw_content: obj.raw_content,
                                    published_date: obj.published_date,
                                })),
                            };
                        });

                        const searchResults = await Promise.all(searchPromises);
                        return {
                            searches: searchResults,
                        };
                    },
                },
                search_knowledge: {
                    description: 'Performs an internal semantic search on the knowledge base.',
                    parameters: z.object({
                        keywords: z.array(z.string()),
                    }),
                    execute: async ({ keywords }) => {},
                },
            },
        });

        return result.toDataStreamResponse();
    } catch (error) {
        console.error(error);

        return new Response(
            JSON.stringify({
                error: error instanceof Error ? error.message : 'an unknown error occurred.',
                status: 500,
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
}
