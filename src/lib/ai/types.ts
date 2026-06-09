import type { UIMessage } from "@ai-sdk/react";
import { z } from "zod";
import type { ArtifactStreamEvent } from "@/lib/artifacts/types";

export const messageMetadataSchema = z.object({
	createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

export interface CustomUIDataTypes {
	"data-artifact": ArtifactStreamEvent;
	[key: string]: unknown; // Required by UIDataTypes constraint
}

export type ChatMessage = UIMessage<MessageMetadata, CustomUIDataTypes>;
export interface Attachment {
	contentType: string;
	name: string;
	url: string;
}
