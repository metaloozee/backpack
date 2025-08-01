import { tool, UIMessageStreamWriter } from 'ai';
import { z } from 'zod';
import { tavily } from '@tavily/core';
import { env } from '@/lib/env.mjs';
import { Session } from 'better-auth';

const tvly = tavily({ apiKey: env.TAVILY_API_KEY });

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

export const webSearchTool = ({
    session,
    dataStream,
}: {
    session: Session;
    dataStream: UIMessageStreamWriter;
}) =>
    tool({
        description: 'Performs a search over the internet for current data.',
        inputSchema: z.object({
            web_search_queries: z.array(z.string()).max(5),
        }),
        execute: async ({ web_search_queries: queries }, { toolCallId }) => {
            dataStream.write({
                type: 'tool-input-available',
                toolCallId,
                toolName: 'web_search',
                input: JSON.stringify({ web_search_queries: queries }),
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

            const searchPromises: Promise<SearchGroup>[] = queries.map(async (query: string) => {
                const res = await tvly.search(query, {
                    maxResults: 5,
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
