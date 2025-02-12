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

const parseToolAnnotations = (annotations: any[]): ToolInvocation[] => {
    const toolAnnotations = annotations?.filter(
        (annotation) => (annotation as { type: string }).type === 'tool_call'
    ) as Array<{
        data: {
            args: string;
            toolCallId: string;
            toolName: string;
            result?: string;
            state: 'call' | 'result';
        };
    }>;

    const toolDataMap = new Map<string, ToolInvocation>();

    toolAnnotations.forEach((annotation) => {
        const existing = toolDataMap.get(annotation.data.toolCallId);
        if (!existing || annotation.data.state === 'result') {
            toolDataMap.set(annotation.data.toolCallId, {
                ...annotation.data,
                args: annotation.data.args ? JSON.parse(annotation.data.args) : {},
                result:
                    annotation.data.result && annotation.data.result !== 'undefined'
                        ? JSON.parse(annotation.data.result)
                        : undefined,
            } as ToolInvocation);
        }
    });

    return Array.from(toolDataMap.values());
};

export function RenderMessage({
    message,
    messageId,
    getIsOpen,
    onOpenChange,
    onQuerySelect,
    chatId,
}: RenderMessageProps) {
    const toolData = React.useMemo(
        () => parseToolAnnotations(message.annotations || []),
        [message.annotations]
    );

    if (message.role === 'user') {
        return <UserMessage message={message.content} />;
    }

    return (
        <div className="w-full flex justify-start items-start">
            <Avatar className="mr-2">
                <AvatarFallback className="bg-zinc-900">
                    <BrainIcon className="size-4" />
                </AvatarFallback>
            </Avatar>

            {toolData.map((tool) => (
                <Tool
                    key={tool.toolCallId}
                    tool={tool}
                    isOpen={getIsOpen(tool.toolCallId)}
                    onOpenChange={(open) => onOpenChange(tool.toolCallId, open)}
                />
            ))}
            {message.content && <BotMessage message={message.content} />}
        </div>
    );
}
