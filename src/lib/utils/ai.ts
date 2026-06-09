import type { ModelMessage, UIMessage } from "ai";
import { formatISO } from "date-fns";
import type { ChatMessage } from "@/lib/ai/types";
import type { Message } from "@/lib/db/schema/app";

type ResponseMessageWithoutId = ModelMessage | UIMessage;
type ResponseMessage = ResponseMessageWithoutId & { id: string };

export function getMostRecentUserMessage(messages: UIMessage[]) {
	const userMessages = messages.filter((message) => message.role === "user");
	return userMessages.at(-1);
}

export function getTrailingMessageId({
	messages,
}: {
	messages: ResponseMessage[];
}): string | null {
	const trailingMessage = messages.at(-1);

	if (!trailingMessage) {
		return null;
	}

	return trailingMessage.id;
}

export function convertToUIMessages(messages: Message[]): ChatMessage[] {
	return messages.map((message) => ({
		id: message.id,
		role: message.role as "user" | "assistant" | "system",
		parts: message.parts as ChatMessage["parts"],
		metadata: {
			createdAt: formatISO(message.createdAt),
		},
	}));
}

export function getTextFromMessage(message: ChatMessage): string {
	return message.parts
		.filter((part) => part.type === "text")
		.map((part) => part.text)
		.join("");
}
