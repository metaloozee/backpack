import * as React from 'react';

import { motion } from 'motion/react';
import { Loader } from '@/components/ui/loader';
import { UseChatHelpers } from '@ai-sdk/react';
import { useMessages } from '@/lib/hooks/use-messages';
import { Message as PreviewMessage } from '@/components/chat/message';
import { ChatMessage } from '@/lib/ai/types';

interface ChatMessageProps {
    chatId: string;
    status: UseChatHelpers<ChatMessage>['status'];
    messages: Array<ChatMessage>;
    setMessages: UseChatHelpers<ChatMessage>['setMessages'];
    regenerate: UseChatHelpers<ChatMessage>['regenerate'];
}

export function ChatMessages({
    chatId,
    status,
    messages,
    setMessages,
    regenerate,
}: ChatMessageProps) {
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
        <div
            ref={messageContainerRef}
            className="px-4 flex flex-col items-center w-full mt-10 mx-auto max-w-3xl"
        >
            {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full">
                    <p className="text-sm text-muted-foreground">
                        No messages yet. Start a conversation!
                    </p>
                </div>
            )}

            {messages.map((message, index) => (
                <PreviewMessage
                    key={message.id}
                    chatId={chatId}
                    message={message}
                    isLoading={status === 'streaming' && messages.length - 1 === index}
                    setMessages={setMessages}
                    regenerate={regenerate}
                    requiresScrollPadding={hasSentMessage && index === messages.length - 1}
                />
            ))}

            {status === 'submitted' &&
                messages.length > 0 &&
                messages[messages.length - 1].role === 'user' && <Loader className="my-10" />}

            <motion.div
                ref={messagesEndRef}
                className="shrink-0 min-w-[24px] min-h-[24px]"
                onViewportLeave={onViewportLeave}
                onViewportEnter={onViewportEnter}
            />
        </div>
    );
}
