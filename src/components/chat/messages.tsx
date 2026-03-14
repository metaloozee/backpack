import type { UseChatHelpers } from "@ai-sdk/react";
import equal from "fast-deep-equal";
import { MessageSquareIcon } from "lucide-react";
import { memo } from "react";
import {
	Conversation,
	ConversationContent,
	ConversationEmptyState,
	ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message as PreviewMessage } from "@/components/chat/message";
import { Loader } from "@/components/ui/loader";
import type { ChatMessage } from "@/lib/ai/types";

interface ChatMessageProps {
	chatId: string;
	status: UseChatHelpers<ChatMessage>["status"];
	messages: ChatMessage[];
	regenerate: UseChatHelpers<ChatMessage>["regenerate"];
}

function PureChatMessages({ status, messages, regenerate }: ChatMessageProps) {
	const latestAssistantId = [...messages]
		.reverse()
		.find((message) => message.role === "assistant")?.id;

	return (
		<Conversation className="w-full">
			<ConversationContent>
				{messages.length === 0 ? (
					<ConversationEmptyState
						description="Type a message below to begin chatting."
						icon={
							<MessageSquareIcon className="size-6 text-muted-foreground" />
						}
						title="Start a conversation"
					/>
				) : (
					messages.map((message, index) => (
						<PreviewMessage
							isLatestAssistant={message.id === latestAssistantId}
							isLoading={
								status === "streaming" &&
								messages.length - 1 === index
							}
							key={message.id}
							message={message}
							regenerate={regenerate}
						/>
					))
				)}

				{status === "submitted" &&
				messages.length > 0 &&
				messages.at(-1)?.role === "user" ? (
					<div className="flex justify-start">
						<Loader className="my-4" />
					</div>
				) : null}
			</ConversationContent>
			<ConversationScrollButton />
		</Conversation>
	);
}

export const ChatMessages = memo(PureChatMessages, (prevProps, nextProps) => {
	if (prevProps.status === "streaming" || nextProps.status === "streaming") {
		return false;
	}

	if (prevProps.status !== nextProps.status) {
		return false;
	}
	if (prevProps.chatId !== nextProps.chatId) {
		return false;
	}
	if (prevProps.messages.length !== nextProps.messages.length) {
		return false;
	}

	if (!equal(prevProps.messages, nextProps.messages)) {
		return false;
	}

	return true;
});
