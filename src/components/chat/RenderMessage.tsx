import * as React from 'react';

import { JSONValue, Message, ToolInvocation } from 'ai';
import { Tool } from '@/components/chat/Tool';
import { UserMessage } from '@/components/chat/UserMessage';
import { AnswerSection } from './AnswerSection';

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

    if (message.toolInvocations?.length) {
        return (
            <>
                {message.toolInvocations.map((tool) => (
                    <Tool
                        key={tool.toolCallId}
                        tool={tool}
                        isOpen={getIsOpen(messageId)}
                        onOpenChange={(open) => onOpenChange(messageId, open)}
                    />
                ))}
            </>
        );
    }

    return (
        <>
            {toolData.map((tool) => (
                <Tool
                    key={tool.toolCallId}
                    tool={tool}
                    isOpen={getIsOpen(tool.toolCallId)}
                    onOpenChange={(open) => onOpenChange(tool.toolCallId, open)}
                />
            ))}
            <AnswerSection
                content={message.content}
                isOpen={getIsOpen(messageId)}
                onOpenChange={(open) => onOpenChange(messageId, open)}
                chatId={chatId}
            />
        </>
    );
}
