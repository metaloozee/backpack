import { tool, type UIMessageStreamWriter } from "ai";
import { z } from "zod";

export const academicSearchTool = ({ dataStream }: { dataStream: UIMessageStreamWriter }) =>
	tool({
		description: "Performs a search for various academic papers and researches",
		inputSchema: z.object({
			academic_search_queries: z.array(z.string()).max(5),
		}),
		execute: ({ academic_search_queries: queries }, { toolCallId }) => {
			dataStream.write({
				type: "tool-input-available",
				toolCallId,
				toolName: "academic_search",
				input: JSON.stringify({ academic_search_queries: queries }),
			});

			// TODO: Implement actual academic search logic
			// biome-ignore lint/suspicious/noExplicitAny: We need to return any type
			const results: any[] = [];

			dataStream.write({
				type: "tool-output-available",
				toolCallId,
				output: JSON.stringify({ results }),
			});

			return {
				results,
			};
		},
	});
