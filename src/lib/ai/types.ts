import type { UIMessage } from "@ai-sdk/react";
import { z } from "zod";
import type { ArtifactStreamEvent } from "@/lib/artifacts/types";

export const messageMetadataSchema = z.object({
	createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

export interface CustomUIDataTypes {
	[key: string]: unknown; // Required by UIDataTypes constraint
	"data-artifact": ArtifactStreamEvent;
}

export type ChatMessage = UIMessage<MessageMetadata, CustomUIDataTypes>;
export interface Attachment {
	name: string;
	url: string;
	contentType: string;
}
