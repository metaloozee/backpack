import * as React from 'react';

import { JSONValue, Message } from 'ai';
import { LoaderIcon } from 'lucide-react';
import { RenderMessage } from '@/components/chat/RenderMessage';
import { motion, AnimatePresence } from 'motion/react';

interface ChatMessageProps {
    messages: Array<Message>;
    data: Array<JSONValue> | undefined;
    onQuerySelect: (query: string) => void;
    isLoading: boolean;
    chatId?: string;
}

interface ToolData {
    state: 'call';
    toolCallId: string;
    toolName: string;
    args: any;
}

const useMessageState = (messages: Array<Message>) => {
    const [openStates, setOpenStates] = React.useState<Record<string, boolean>>({});
    const manualToolCallId = 'manual-tool-call';

    React.useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.role === 'user') {
            setOpenStates({ [manualToolCallId]: true });
        }
    }, [messages]);

    const getIsOpen = (id: string) => {
        const baseId = id.endsWith('-related') ? id.slice(0, -8) : id;
        const index = messages.findIndex((msg) => msg.id === baseId);
        const lastUserIndex =
            messages.length - 1 - [...messages].reverse().findIndex((msg) => msg.role === 'user');
        return openStates[id] ?? index >= lastUserIndex;
    };

    const handleOpenChange = (id: string, open: boolean) => {
        setOpenStates((prev) => ({
            ...prev,
            [id]: open,
        }));
    };

    return { getIsOpen, handleOpenChange };
};

const useLastToolData = (data: Array<JSONValue> | undefined): ToolData | null => {
    return React.useMemo(() => {
        if (!data || !Array.isArray(data) || data.length === 0) return null;

        const lastItem = data[data.length - 1] as {
            type: 'tool_call';
            data: {
                toolCallId: string;
                state: 'call' | 'result';
                toolName: string;
                args: string;
            };
        };

        if (lastItem.type !== 'tool_call') return null;

        const toolData = lastItem.data;
        return {
            state: 'call' as const,
            toolCallId: toolData.toolCallId,
            toolName: toolData.toolName,
            args: toolData.args ? JSON.parse(toolData.args) : undefined,
        };
    }, [data]);
};

export function ChatMessages({
    messages,
    data,
    onQuerySelect,
    isLoading,
    chatId,
}: ChatMessageProps) {
    const messageEndRef = React.useRef<HTMLDivElement>(null);
    const { getIsOpen, handleOpenChange } = useMessageState(messages);
    const lastToolData = useLastToolData(data);

    const scrollToBottom = () => {
        messageEndRef.current?.scrollIntoView({ behavior: 'instant' });
    };

    React.useEffect(() => {
        scrollToBottom();
    }, []);

    if (!messages.length) return null;

    const showLoading = isLoading && messages[messages.length - 1].role === 'user';

    return (
        <motion.div
            layout
            transition={{
                duration: 0.3,
                ease: [0.32, 0.72, 0, 1],
                layout: {
                    duration: 0.3,
                },
            }}
            className="relative mx-auto px-4 w-full mb-48"
        >
            <AnimatePresence>
                {messages.map((message) => (
                    <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{
                            duration: 0.3,
                            ease: [0.32, 0.72, 0, 1],
                        }}
                        className=" flex flex-col gap-4"
                    >
                        <RenderMessage
                            message={message}
                            messageId={message.id}
                            getIsOpen={getIsOpen}
                            onOpenChange={handleOpenChange}
                            onQuerySelect={onQuerySelect}
                            chatId={chatId}
                        />
                    </motion.div>
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
                            className="flex justify-center"
                        >
                            {lastToolData ? (
                                <div></div>
                            ) : (
                                <div className="animate-spin">
                                    <LoaderIcon className="size-4" />
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </AnimatePresence>
            <div ref={messageEndRef} />
        </motion.div>
    );
}
