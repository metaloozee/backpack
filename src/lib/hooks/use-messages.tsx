import type { UseChatHelpers } from "@ai-sdk/react";
import { useEffect, useState } from "react";
import { useScrollToBottom } from "@/lib/hooks/use-scroll-to-bottom";
import type { ChatMessage } from "../ai/types";

export function useMessages({
	chatId,
	status,
}: {
	chatId: string;
	status: UseChatHelpers<ChatMessage>["status"];
}) {
	const {
		containerRef,
		endRef,
		isAtBottom,
		scrollToBottom,
		onViewportEnter,
		onViewportLeave,
	} = useScrollToBottom();

	const [hasSentMessage, setHasSentMessage] = useState(false);
	const [prevChatId, setPrevChatId] = useState(chatId);
	const [prevStatus, setPrevStatus] = useState(status);

	if (chatId !== prevChatId) {
		setPrevChatId(chatId);
		setHasSentMessage(false);
	}

	if (status !== prevStatus) {
		setPrevStatus(status);
		if (status === "submitted") {
			setHasSentMessage(true);
		}
	}

	useEffect(() => {
		if (chatId) {
			scrollToBottom("instant");
		}
	}, [chatId, scrollToBottom]);

	return {
		containerRef,
		endRef,
		isAtBottom,
		scrollToBottom,
		onViewportEnter,
		onViewportLeave,
		hasSentMessage,
	};
}
