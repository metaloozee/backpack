export interface ToolsState {
	webSearch?: boolean;
	knowledgeSearch?: boolean;
	academicSearch?: boolean;
	financeSearch?: boolean;
}

export interface UserPrefs {
	modelId: string;
	mode: string;
	selectedAgent: string | null;
	toolsState: ToolsState;
	mcpServersState: Record<string, boolean>;
}

export type ActiveTool =
	| "save_to_memories"
	| "extract"
	| "web_search"
	| "knowledge_search"
	| "academic_search"
	| "finance_search";
