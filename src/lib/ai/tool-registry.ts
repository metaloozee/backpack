import {
	BookCopyIcon,
	GlobeIcon,
	GraduationCapIcon,
	LandmarkIcon,
	type LucideIcon,
} from "lucide-react";

export type BuiltInToolId =
	| "webSearch"
	| "knowledgeSearch"
	| "academicSearch"
	| "financeSearch";

export type RuntimeToolName =
	| "save_to_memories"
	| "extract"
	| "web_search"
	| "knowledge_search"
	| "academic_search"
	| "finance_search";

export interface Tool {
	id: BuiltInToolId;
	runtimeName: RuntimeToolName;
	name: string;
	description: string;
	icon: LucideIcon;
	enabled: boolean;
}

export type ToolsState = Record<BuiltInToolId, boolean>;

export const builtInToolRegistry = [
	{
		id: "webSearch",
		runtimeName: "web_search",
		name: "Web Search",
		description: "Search the web for real-time information",
		icon: GlobeIcon,
		enabled: false,
	},
	{
		id: "knowledgeSearch",
		runtimeName: "knowledge_search",
		name: "Knowledge Search",
		description: "Search through your knowledge base",
		icon: BookCopyIcon,
		enabled: false,
	},
	{
		id: "academicSearch",
		runtimeName: "academic_search",
		name: "Academic Search",
		description: "Search academic papers and research",
		icon: GraduationCapIcon,
		enabled: false,
	},
	{
		id: "financeSearch",
		runtimeName: "finance_search",
		name: "Finance Search",
		description: "Search financial data and information",
		icon: LandmarkIcon,
		enabled: false,
	},
] as const satisfies readonly Tool[];

export const defaultTools = builtInToolRegistry;

export const getDefaultToolsState = (): ToolsState => {
	return Object.fromEntries(
		builtInToolRegistry.map((tool) => [tool.id, tool.enabled])
	) as ToolsState;
};

export const getToolById = (toolId: string): Tool | undefined => {
	return builtInToolRegistry.find((tool) => tool.id === toolId);
};

export const buildActiveBuiltInRuntimeTools = (
	toolsState: ToolsState
): RuntimeToolName[] => {
	const activeTools: RuntimeToolName[] = ["extract"];

	for (const tool of builtInToolRegistry) {
		if (toolsState[tool.id]) {
			activeTools.push(tool.runtimeName);
		}
	}

	return activeTools;
};
