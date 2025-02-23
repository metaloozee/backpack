import * as React from 'react';

import { JSONValue, Message, tool, ToolInvocation } from 'ai';
import { Loader, LoaderIcon } from 'lucide-react';
import { RenderMessage } from '@/components/chat/RenderMessage';
import { motion, AnimatePresence } from 'motion/react';
import { TextShimmer } from '../ui/text-shimmer';
import { Tool } from './Tool';

interface ChatMessageProps {
    messages: Array<Message>;
    data: Array<JSONValue> | undefined;
    onQuerySelect: (query: string) => void;
    isLoading: boolean;
    chatId?: string;
}

interface ToolData {
    type: 'tool-call';
    data: {
        toolCallId: string;
        toolName: string;
        state: 'call' | 'result';
        args: string;
        result?: string;
    };
}

const useLastToolData = (data: Array<JSONValue> | undefined): ToolData | null => {
    if (!data || data.length === 0) return null;

    const lastItem = data[data.length - 1];
    if (typeof lastItem === 'object' && lastItem !== null) {
        const toolData = lastItem as any;
        if (toolData.type === 'tool-call' && toolData.data) {
            return toolData as ToolData;
        }
    }
    return null;
};

export function ChatMessages({
    messages,
    data,
    onQuerySelect,
    isLoading,
    chatId,
}: ChatMessageProps) {
    const messageEndRef = React.useRef<HTMLDivElement>(null);
    const lastToolData = React.useMemo(() => {
        if (!data || !Array.isArray(data) || data.length == 0) return null;

        const lastItem = data[data.length - 1] as {
            type: 'tool-call';
            data: {
                toolCallId: string;
                state: 'call' | 'result';
                toolName: string;
                args: string;
            };
        };

        if (lastItem.type !== 'tool-call') return null;

        const toolData = lastItem.data;
        return {
            state: 'call' as const,
            toolCallId: toolData.toolCallId,
            toolName: toolData.toolName,
            args: toolData.args ? JSON.parse(toolData.args) : undefined,
        };
    }, [data]);

    const scrollToBottom = () => {
        messageEndRef.current?.scrollIntoView({ behavior: 'instant' });
    };

    React.useEffect(() => {
        scrollToBottom();
    }, [messages]);

    if (!messages.length) return null;

    const showLoading = isLoading && messages[messages.length - 1].role === 'user';

    return (
        <div className="px-4 w-full mt-10">
            {messages.map((message) => (
                <RenderMessage
                    key={message.id}
                    message={message}
                    messageId={message.id}
                    getIsOpen={() => true}
                    onOpenChange={() => {}}
                    onQuerySelect={onQuerySelect}
                    chatId={chatId}
                />
            ))}

            <AnimatePresence>
                {showLoading && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{
                            duration: 0.2,
                            ease: [0.32, 0.72, 0, 1],
                        }}
                        className="flex justify-start mb-10"
                    >
                        {lastToolData ? (
                            <Tool tool={lastToolData} isOpen={true} onOpenChange={() => {}} />
                        ) : (
                            <Loader className="ml-4 size-3 animate-spin text-muted-foreground" />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
            <div ref={messageEndRef} />
        </div>
    );
}
