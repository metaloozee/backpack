import { tavily } from '@tavily/core';
import { extractDomain, deduplicateByDomainAndUrl } from '@/lib/ai/tools/webSearch';
import { type UIMessageStreamWriter, tool } from 'ai';
import z from 'zod';
import { env } from '@/lib/env.mjs';

const tvly = tavily({ apiKey: env.TAVILY_API_KEY });

export const newsSearchTool = ({ dataStream }: { dataStream: UIMessageStreamWriter }) =>
    tool({
        description: 'Performs a search over news outlets for a particular topic.',
        inputSchema: z.object({
            news_search_queries: z.array(z.string()).max(2),
        }),
        execute: async ({ news_search_queries: queries }, { toolCallId }) => {
            dataStream.write({
                type: 'tool-input-available',
                toolCallId,
                toolName: 'news_search',
                input: JSON.stringify({ news_search_queries: queries }),
            });

            console.log('News Search Queries: ', queries);

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

            const searchPromises: Promise<SearchGroup>[] = queries.map(async (query) => {
                const res = await tvly.search(query, {
                    maxResults: 5,
                    searchDepth: 'advanced',
                    includeAnswer: true,
                    topic: 'news',
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

            dataStream.write({
                type: 'tool-output-available',
                toolCallId,
                output: JSON.stringify({ searches: searchResults }),
            });

            return {
                searches: searchResults,
            };
        },
    });
