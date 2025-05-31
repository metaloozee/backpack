import * as React from 'react';
import { Message, ToolInvocation } from 'ai';
import { Tool } from '@/components/chat/Tool';
import { UserMessage } from '@/components/chat/UserMessage';
import { BotMessage } from '@/components/chat/Message';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { BrainIcon } from 'lucide-react';
import TrpcProvider from '@/lib/trpc/Provider';

interface RenderMessageProps {
    message: Message;
    messageId: string;
    getIsOpen: (id: string) => boolean;
    onOpenChange: (id: string, open: boolean) => void;
    onQuerySelect: (query: string) => void;
    chatId?: string;
}

export function RenderMessage({
    message,
    messageId,
    getIsOpen,
    onOpenChange,
    onQuerySelect,
    chatId,
}: RenderMessageProps) {
    const toolData = React.useMemo(() => {
        // First, try to get tools from the custom message.parts structure
        const toolAnnotations =
            message.parts?.filter((part) => part.type === 'tool-invocation') || [];

        if (toolAnnotations.length > 0) {
            const toolDataMap = toolAnnotations.reduce((acc, annotation: any) => {
                const existing = acc.get(annotation.toolInvocation.toolCallId);
                if (!existing || annotation.toolInvocation.state === 'result') {
                    acc.set(annotation.toolInvocation.toolCallId, annotation);
                }
                return acc;
            }, new Map<string, any>());

            return Array.from(toolDataMap.values());
        }

        // Fallback to standard Vercel AI SDK toolInvocations structure
        if (message.toolInvocations && message.toolInvocations.length > 0) {
            return message.toolInvocations.map((toolInvocation) => ({
                toolInvocation,
            }));
        }

        return null;
    }, [message.parts, message.toolInvocations]);

    if (message.role === 'user') {
        return (
            <div className="w-full flex justify-end">
                <UserMessage message={message.content} />
            </div>
        );
    }

    return (
        <>
            {message.content && <BotMessage message={message.content} />}
            {toolData && toolData.length > 0 && (
                <div className="flex flex-row flex-wrap gap-2 mt-2">
                    {toolData.map((tool, index) => (
                        <Tool key={`${messageId}-tool-${index}`} tool={tool} />
                    ))}
                </div>
            )}
        </>
    );
}
