import type { UIMessage } from "@ai-sdk/react";
import { z } from "zod";

export const messageMetadataSchema = z.object({
	createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

export interface CustomUIDataTypes {
	[key: string]: unknown; // Required by UIDataTypes constraint
	textDelta: string;
	imageDelta: string;
	sheetDelta: string;
	codeDelta: string;
	appendMessage: string;
	id: string;
	title: string;
	clear: null;
	finish: null;
}

export type ChatMessage = UIMessage<MessageMetadata>;
export interface Attachment {
	name: string;
	url: string;
	contentType: string;
}
