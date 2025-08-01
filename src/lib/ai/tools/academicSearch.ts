import { tool } from 'ai';
import { z } from 'zod';
import { Session } from 'better-auth';
import { UIMessageStreamWriter } from 'ai';

export const academicSearchTool = ({
    session,
    dataStream,
}: {
    session: Session;
    dataStream: UIMessageStreamWriter;
}) =>
    tool({
        description: 'Performs a search for various academic papers and researches',
        inputSchema: z.object({
            academic_search_queries: z.array(z.string()).max(5),
        }),
        execute: async ({ academic_search_queries: queries }, { toolCallId }) => {
            dataStream.write({
                type: 'tool-input-available',
                toolCallId,
                toolName: 'academic_search',
                input: JSON.stringify({ academic_search_queries: queries }),
            });

            console.log('Academic Search Queries: ', queries);

            // TODO: Implement actual academic search logic
            const results: any[] = [];

            dataStream.write({
                type: 'tool-output-available',
                toolCallId,
                output: JSON.stringify({ results }),
            });

            return {
                results,
            };
        },
    });
