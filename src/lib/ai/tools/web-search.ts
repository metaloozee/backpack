import { tavily } from "@tavily/core";
import { tool, type UIMessageStreamWriter } from "ai";
import { z } from "zod";
import { env } from "@/lib/env.mjs";

const tvly = tavily({ apiKey: env.TAVILY_API_KEY });

const urlPattern = /^https?:\/\/([^/?#]+)(?:[/?#]|$)/i;

export const extractDomain = (url: string): string => {
	return url.match(urlPattern)?.[1] || url;
};

export const deduplicateByDomainAndUrl = <T extends { url: string }>(items: T[]): T[] => {
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

export const webSearchTool = ({ dataStream }: { dataStream: UIMessageStreamWriter }) =>
	tool({
		description: "Performs a search over the internet for current data.",
		inputSchema: z.object({
			web_search_queries: z.array(z.string()).max(5),
		}),
		execute: async ({ web_search_queries: queries }, { toolCallId }) => {
			dataStream.write({
				type: "tool-input-available",
				toolCallId,
				toolName: "web_search",
				input: JSON.stringify({ web_search_queries: queries }),
			});

			type SearchGroup = {
				query: string;
				results: {
					url: string;
					title: string;
					content: string;
					raw_content: string | undefined;
					published_date: string | null;
				}[];
				images: {
					url: string;
					description: string;
				}[];
			};

			const searchPromises: Promise<SearchGroup>[] = queries.map(async (query: string) => {
				const res = await tvly.search(query, {
					maxResults: 5,
					searchDepth: "advanced",
					includeAnswer: true,
					includeImages: true,
				});

				return {
					query,
					results: deduplicateByDomainAndUrl(res.results).map((obj) => ({
						url: obj.url,
						title: obj.title,
						content: obj.content,
						raw_content: obj.rawContent,
						published_date: obj.publishedDate,
					})),
					images: res.images.map((img) => ({
						url: img.url || "",
						description: img.description || "",
					})),
				};
			});

			const searchResults = await Promise.all(searchPromises);

			dataStream.write({
				type: "tool-output-available",
				toolCallId,
				output: JSON.stringify({ searches: searchResults }),
			});

			return {
				searches: searchResults,
			};
		},
	});
