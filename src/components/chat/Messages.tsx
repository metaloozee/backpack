import * as React from 'react';

import { UIMessage } from 'ai';
import { Loader, LoaderIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TextShimmer } from '../ui/text-shimmer';
import { Tool } from './Tool';
import { UseChatHelpers } from '@ai-sdk/react';
import { useMessages } from '@/hooks/use-messages';
import { Message as PreviewMessage } from '@/components/chat/message';

interface ChatMessageProps {
    chatId: string;
    status: UseChatHelpers['status'];
    messages: Array<UIMessage>;
    setMessages: UseChatHelpers['setMessages'];
    reload: UseChatHelpers['reload'];
}

export function ChatMessages({ chatId, status, messages, setMessages, reload }: ChatMessageProps) {
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
        <div ref={messageContainerRef} className="px-4 w-full mt-10 mx-auto max-w-3xl">
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
                    reload={reload}
                    requiresScrollPadding={hasSentMessage && index === messages.length - 1}
                />
            ))}

            {status === 'submitted' &&
                messages.length > 0 &&
                messages[messages.length - 1].role === 'user' && (
                    <LoaderIcon className="animate-spin" />
                )}

            <motion.div
                ref={messagesEndRef}
                className="shrink-0 min-w-[24px] min-h-[24px]"
                onViewportLeave={onViewportLeave}
                onViewportEnter={onViewportEnter}
            />
        </div>
    );
}
