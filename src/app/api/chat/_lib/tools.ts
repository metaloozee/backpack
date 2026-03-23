import type { UIMessageStreamWriter } from "ai";
import { academicSearchTool } from "@/lib/ai/tools/academic-search";
import { extractTool } from "@/lib/ai/tools/extract";
import { financeSearchTool } from "@/lib/ai/tools/finance-search";
import { knowledgeSearchTool } from "@/lib/ai/tools/knowledge-search";
import { saveToMemoriesTool } from "@/lib/ai/tools/save-to-memories";
import { webSearchTool } from "@/lib/ai/tools/web-search";
import type { ChatMessage } from "@/lib/ai/types";
import type { McpServerConfig as DbMcpServerConfig } from "@/lib/db/schema/mcp";
import { closeMcpClients, createMcpToolsForServers } from "@/lib/mcp/client";
import type { ActiveTool, ToolsState } from "./types";

const buildActiveTools = (toolsState: ToolsState): ActiveTool[] => {
	const activeTools: ActiveTool[] = ["extract"];

	if (toolsState.webSearch) {
		activeTools.push("web_search");
	}
	if (toolsState.knowledgeSearch) {
		activeTools.push("knowledge_search");
	}
	if (toolsState.academicSearch) {
		activeTools.push("academic_search");
	}
	if (toolsState.financeSearch) {
		activeTools.push("finance_search");
	}

	return activeTools;
};

export const buildToolRuntime = async ({
	toolsState,
	userId,
	requestEnv,
	dataStream,
	mcpServerConfigs,
}: {
	toolsState: ToolsState;
	userId: string;
	requestEnv: {
		inSpace: boolean;
		spaceId?: string;
	};
	dataStream: UIMessageStreamWriter<ChatMessage>;
	mcpServerConfigs: Pick<
		DbMcpServerConfig,
		"name" | "url" | "enabled" | "apiKeyEncrypted"
	>[];
}) => {
	const activeTools = buildActiveTools(toolsState);

	const mcpServersForTools = mcpServerConfigs
		.filter((config) => config.enabled)
		.map((config) => ({
			name: config.name,
			url: config.url,
			apiKey: config.apiKeyEncrypted ?? undefined,
		}));

	const mcpToolsResult =
		mcpServersForTools.length > 0
			? await createMcpToolsForServers(mcpServersForTools)
			: {
					tools: {},
					clients: [],
					serverNames: new Map(),
					toolInfos: [],
				};

	const allTools = {
		save_to_memories: saveToMemoriesTool({
			userId,
			dataStream,
		}),
		extract: extractTool({ dataStream }),
		web_search: webSearchTool({ dataStream }),
		knowledge_search: knowledgeSearchTool({
			userId,
			dataStream,
			env: requestEnv,
		}),
		academic_search: academicSearchTool({ dataStream }),
		finance_search: financeSearchTool({ dataStream }),
		...mcpToolsResult.tools,
	};

	const mcpToolNames = Object.keys(mcpToolsResult.tools);
	const allActiveTools = [...activeTools, ...mcpToolNames] as Array<
		keyof typeof allTools
	>;

	return {
		allTools,
		activeTools: allActiveTools,
		activeBuiltInTools: activeTools,
		mcpToolNames,
		mcpToolInfos: mcpToolsResult.toolInfos,
		close: async () => {
			if (mcpToolsResult.clients.length > 0) {
				await closeMcpClients(mcpToolsResult.clients);
			}
		},
	};
};
