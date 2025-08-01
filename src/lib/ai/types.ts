import { InferUITool, UIMessage } from 'ai';
import { z } from 'zod';

import type { academicSearchTool } from './tools/academicSearch';
import type { extractTool } from './tools/extract';
import type { knowledgeSearchTool } from './tools/knowledgeSearch';
import type { saveToMemoriesTool } from './tools/saveToMemories';
import type { webSearchTool } from './tools/webSearch';

export const messageMetadataSchema = z.object({
    createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

type saveToMemoriesTool = InferUITool<ReturnType<typeof saveToMemoriesTool>>;
type extractTool = InferUITool<ReturnType<typeof extractTool>>;
type webSearchTool = InferUITool<ReturnType<typeof webSearchTool>>;
type knowledgeSearchTool = InferUITool<ReturnType<typeof knowledgeSearchTool>>;
type academicSearchTool = InferUITool<ReturnType<typeof academicSearchTool>>;

export type ChatTools = {
    save_to_memories: saveToMemoriesTool;
    extract: extractTool;
    web_search: webSearchTool;
    knowledge_search: knowledgeSearchTool;
    academic_search: academicSearchTool;
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
export interface Attachment {
    name: string;
    url: string;
    contentType: string;
}
