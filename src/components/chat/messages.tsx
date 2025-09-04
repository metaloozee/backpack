import type { UseChatHelpers } from "@ai-sdk/react";

import { motion } from "motion/react";
import { Message as PreviewMessage } from "@/components/chat/message";
import { Loader } from "@/components/ui/loader";
import type { ChatMessage } from "@/lib/ai/types";
import { useMessages } from "@/lib/hooks/use-messages";

type ChatMessageProps = {
	chatId: string;
	status: UseChatHelpers<ChatMessage>["status"];
	messages: ChatMessage[];
	setMessages: UseChatHelpers<ChatMessage>["setMessages"];
	regenerate: UseChatHelpers<ChatMessage>["regenerate"];
};

export function ChatMessages({ chatId, status, messages, setMessages, regenerate }: ChatMessageProps) {
	const {
		containerRef: messageContainerRef,
		endRef: messagesEndRef,
		onViewportEnter,
		onViewportLeave,
		hasSentMessage,
	} = useMessages({
		chatId,
		status,
	});

	return (
		<div className="mx-auto mt-10 flex w-full max-w-3xl flex-col items-center px-4" ref={messageContainerRef}>
			{messages.length === 0 && (
				<div className="flex h-full flex-col items-center justify-center">
					<p className="text-muted-foreground text-sm">No messages yet. Start a conversation!</p>
				</div>
			)}

			{messages.map((message, index) => (
				<PreviewMessage
					isLoading={status === "streaming" && messages.length - 1 === index}
					key={message.id}
					message={message}
					regenerate={regenerate}
					requiresScrollPadding={hasSentMessage && index === messages.length - 1}
					setMessages={setMessages}
				/>
			))}

			{status === "submitted" && messages.length > 0 && messages.at(-1)?.role === "user" && (
				<Loader className="my-10" />
			)}

			<motion.div
				className="min-h-[24px] min-w-[24px] shrink-0"
				onViewportEnter={onViewportEnter}
				onViewportLeave={onViewportLeave}
				ref={messagesEndRef}
			/>
		</div>
	);
}
