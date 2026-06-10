import type { ToolsState as RegistryToolsState } from "@/lib/ai/tool-registry";

export type { ToolsState } from "@/lib/ai/tool-registry";

export interface UserPrefs {
	mcpServersState: Record<string, boolean>;
	mode: "ask" | "agent";
	modelId: string;
	selectedAgent: string | null;
	toolsState: RegistryToolsState;
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
