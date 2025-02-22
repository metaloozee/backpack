import * as React from 'react';
import { Message, ToolInvocation } from 'ai';
import { Tool } from '@/components/chat/Tool';
import { UserMessage } from '@/components/chat/UserMessage';
import { BotMessage } from '@/components/chat/Message';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { BrainIcon } from 'lucide-react';

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
        const toolAnnotations =
            (message.annotations?.filter(
                (annotation) => (annotation as unknown as { type: string }).type === 'tool-call'
            ) as unknown as Array<{
                data: {
                    args: string;
                    toolCallId: string;
                    toolName: string;
                    result?: string;
                    state: 'call' | 'result';
                };
            }>) || [];

        const toolDataMap = toolAnnotations.reduce((acc, annotation) => {
            const existing = acc.get(annotation.data.toolCallId);
            if (!existing || annotation.data.state === 'result') {
                acc.set(annotation.data.toolCallId, {
                    ...annotation.data,
                    args: annotation.data.args ? JSON.parse(annotation.data.args) : {},
                    result:
                        annotation.data.result && annotation.data.result !== 'undefined'
                            ? JSON.parse(annotation.data.result)
                            : undefined,
                });
            }
            return acc;
        }, new Map<string, ToolInvocation>());

        return Array.from(toolDataMap.values());
    }, [message.annotations]);

    if (message.role === 'user') {
        return <UserMessage message={message.content} />;
    }

    return (
        <>
            <div className="flex flex-row gap-2">
                {toolData.map((tool) => (
                    <Tool
                        key={tool.toolCallId}
                        tool={tool}
                        isOpen={getIsOpen(tool.toolCallId)}
                        onOpenChange={(open) => onOpenChange(tool.toolCallId, open)}
                    />
                ))}
            </div>
            {message.content && <BotMessage message={message.content} />}
        </>
    );
}
