import type { ToolsState as RegistryToolsState } from "@/lib/ai/tool-registry";

export type { ToolsState } from "@/lib/ai/tool-registry";

export interface UserPrefs {
	modelId: string;
	mode: "ask" | "agent";
	selectedAgent: string | null;
	toolsState: RegistryToolsState;
	mcpServersState: Record<string, boolean>;
}

export type ActiveTool =
	| "save_to_memories"
	| "extract"
	| "web_search"
	| "knowledge_search"
	| "academic_search"
	| "finance_search"
	| "create_text_artifact"
	| "update_text_artifact";
