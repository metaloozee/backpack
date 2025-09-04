import type { InferUITool, UIMessage } from "ai";
import { z } from "zod";

import type { academicSearchTool } from "./tools/academic-search";
import type { extractTool } from "./tools/extract";
import type { financeSearchTool } from "./tools/finance-search";
import type { knowledgeSearchTool } from "./tools/knowledge-search";
import type { saveToMemoriesTool } from "./tools/save-to-memories";
import type { webSearchTool } from "./tools/web-search";

export const messageMetadataSchema = z.object({
	createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

type SaveToMemoriesToolType = InferUITool<ReturnType<typeof saveToMemoriesTool>>;
type ExtractToolType = InferUITool<ReturnType<typeof extractTool>>;
type WebSearchToolType = InferUITool<ReturnType<typeof webSearchTool>>;
type KnowledgeSearchToolType = InferUITool<ReturnType<typeof knowledgeSearchTool>>;
type AcademicSearchToolType = InferUITool<ReturnType<typeof academicSearchTool>>;
type FinanceSearchToolType = InferUITool<ReturnType<typeof financeSearchTool>>;

export type ChatTools = {
	save_to_memories: SaveToMemoriesToolType;
	extract: ExtractToolType;
	web_search: WebSearchToolType;
	knowledge_search: KnowledgeSearchToolType;
	academic_search: AcademicSearchToolType;
	finance_search: FinanceSearchToolType;
};

export type CustomUIDataTypes = {
	textDelta: string;
	imageDelta: string;
	sheetDelta: string;
	codeDelta: string;
	appendMessage: string;
	id: string;
	title: string;
	clear: null;
	finish: null;
};

export type ChatMessage = UIMessage<MessageMetadata, CustomUIDataTypes, ChatTools>;
export type Attachment = {
	name: string;
	url: string;
	contentType: string;
};
