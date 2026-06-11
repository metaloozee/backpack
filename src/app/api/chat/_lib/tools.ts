import type { LanguageModel, UIMessageStreamWriter } from "ai";
import { buildActiveBuiltInRuntimeTools } from "@/lib/ai/tool-registry";
import { academicSearchTool } from "@/lib/ai/tools/academic-search";
import {
	createTextArtifactTool,
	updateTextArtifactTool,
} from "@/lib/ai/tools/artifacts";
import { extractTool } from "@/lib/ai/tools/extract";
import { financeSearchTool } from "@/lib/ai/tools/finance-search";
import { knowledgeSearchTool } from "@/lib/ai/tools/knowledge-search";
import { saveToMemoriesTool } from "@/lib/ai/tools/save-to-memories";
import { webSearchTool } from "@/lib/ai/tools/web-search";
import type { ChatMessage } from "@/lib/ai/types";
import type { McpServerConfig as DbMcpServerConfig } from "@/lib/db/schema/mcp";
import { closeMcpClients, createMcpToolsForServers } from "@/lib/mcp/client";
import type { ActiveTool, ToolsState } from "./types";

const buildActiveTools = (toolsState: ToolsState): ActiveTool[] =>
	buildActiveBuiltInRuntimeTools(toolsState) as ActiveTool[];

export const buildToolRuntime = async ({
	toolsState,
	userId,
	chatId,
	requestEnv,
	dataStream,
	mcpServerConfigs,
	artifactModel,
	artifactContext,
}: {
	toolsState: ToolsState;
	userId: string;
	chatId: string;
	requestEnv: {
		inSpace: boolean;
		spaceId?: string;
	};
	dataStream: UIMessageStreamWriter<ChatMessage>;
	artifactModel: LanguageModel;
	artifactContext?: {
		activeArtifactId?: string;
	};
	mcpServerConfigs: Pick<
		DbMcpServerConfig,
		"id" | "name" | "url" | "enabled" | "apiKeyEncrypted"
	>[];
}) => {
	const activeTools = buildActiveTools(toolsState);

	const mcpServersForTools = mcpServerConfigs
		.filter((config) => config.enabled)
		.map((config) => ({
			id: config.id,
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
		create_text_artifact: createTextArtifactTool({
			userId,
			chatId,
			model: artifactModel,
			dataStream,
		}),
		update_text_artifact: updateTextArtifactTool({
			userId,
			chatId,
			model: artifactModel,
			dataStream,
			activeArtifactId: artifactContext?.activeArtifactId,
		}),
		...mcpToolsResult.tools,
	};

	const mcpToolNames = Object.keys(mcpToolsResult.tools);
	const artifactToolNames = [
		"create_text_artifact",
		"update_text_artifact",
	] as const;
	const allActiveTools = [
		...activeTools,
		...artifactToolNames,
		...mcpToolNames,
	] as Array<keyof typeof allTools>;

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
