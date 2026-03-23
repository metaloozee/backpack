import AgentModePrompt from "@/lib/ai/prompts/agent";
import AskModePrompt from "@/lib/ai/prompts/ask";
import type { McpToolInfo } from "@/lib/mcp/client";
import type { ToolsState } from "./types";

interface BuildSystemPromptParams {
	mode: string;
	selectedAgent: string | null;
	requestEnv: {
		inSpace: boolean;
		spaceId?: string;
		spaceName?: string;
		spaceDescription?: string;
		spaceCustomInstructions?: string;
	};
	userMemories: Array<{ content: string; createdAt: Date }>;
	toolsState: ToolsState;
	mcpToolInfos: McpToolInfo[];
}

export const buildSystemPrompt = ({
	mode,
	selectedAgent,
	requestEnv,
	userMemories,
	toolsState,
	mcpToolInfos,
}: BuildSystemPromptParams): string => {
	if (mode === "agent" && selectedAgent) {
		return AgentModePrompt({
			agent: selectedAgent,
			env: {
				...requestEnv,
				memories: userMemories,
			},
		});
	}

	return AskModePrompt({
		tools: {
			webSearch: toolsState.webSearch ?? false,
			knowledgeSearch: toolsState.knowledgeSearch ?? false,
			academicSearch: toolsState.academicSearch ?? false,
			financeSearch: toolsState.financeSearch ?? false,
		},
		mcpTools: mcpToolInfos,
		env: {
			...requestEnv,
			memories: userMemories,
		},
	});
};
