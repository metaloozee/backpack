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

interface ToolData {
    type: 'tool_call';
    data: {
        toolCallId: string;
        toolName: string;
        state: 'call' | 'result';
        args: string;
        result?: string;
    };
}

const parseToolAnnotations = (annotations: any[]): ToolData[] => {
    if (!annotations?.length) return [];

    const toolAnnotations = annotations.filter(
        (annotation) => annotation.type === 'tool-call'
    ) as ToolData[];

    const toolDataMap = new Map<string, ToolData>();

    toolAnnotations.forEach((annotation) => {
        const existing = toolDataMap.get(annotation.data.toolCallId);
        if (!existing || annotation.data.state === 'result') {
            toolDataMap.set(annotation.data.toolCallId, annotation);
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
        <>
            {toolData.map((tool) => (
                <Tool
                    key={tool.data.toolCallId}
                    tool={tool}
                    isOpen={getIsOpen(tool.data.toolCallId)}
                    onOpenChange={(open) => onOpenChange(tool.data.toolCallId, open)}
                />
            ))}
            {message.content && <BotMessage message={message.content} />}
        </>
    );
}
