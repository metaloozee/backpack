import { tool, UIMessageStreamWriter } from 'ai';
import { z } from 'zod';
import { tavily } from '@tavily/core';
import { env } from '@/lib/env.mjs';
import { Session } from 'better-auth';

const tvly = tavily({ apiKey: env.TAVILY_API_KEY });

type ExtractResult = {
    url: string;
    images: string[] | undefined;
    content: string;
};

export const extractTool = ({
    session,
    dataStream,
}: {
    session: Session;
    dataStream: UIMessageStreamWriter;
}) =>
    tool({
        description: 'Extract web page content from one or more specified URLs.',
        inputSchema: z.object({
            urls: z.array(z.string()),
        }),
        execute: async ({ urls }, { toolCallId }) => {
            dataStream.write({
                type: 'tool-input-available',
                toolCallId,
                toolName: 'extract',
                input: JSON.stringify({ urls }),
            });

            console.log('Extracting URLs: ', urls);

            const res = await tvly.extract(urls, { extractDepth: 'advanced' });

            const results: ExtractResult[] = res.results.map((result) => ({
                url: result.url,
                images: result.images,
                content: result.rawContent,
            }));

            dataStream.write({
                type: 'tool-output-available',
                toolCallId,
                output: JSON.stringify({ results }),
            });

            return {
                results: results.map((res) => ({
                    url: res.url,
                    content: res.content,
                })),
            };
        },
    });
