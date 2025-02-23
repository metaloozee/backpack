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
        const toolAnnotations =
            message.parts?.filter((part) => part.type === 'tool-invocation') || [];

        if (toolAnnotations.length == 0) {
            return null;
        }

        const toolDataMap = toolAnnotations.reduce((acc, annotation: any) => {
            const existing = acc.get(annotation.toolInvocation.toolCallId);
            if (!existing || annotation.toolInvocation.state === 'result') {
                acc.set(annotation.toolInvocation.toolCallId, annotation);
            }
            return acc;
        }, new Map<string, ToolInvocation>());

        const toolArray = Array.from(toolDataMap.values());

        return toolArray;
    }, [message.parts]);

    if (message.role === 'user') {
        return <UserMessage message={message.content} />;
    }

    return (
        <>
            <div className="flex flex-row gap-2">
                {toolData?.map((tool, index) => <Tool key={index} tool={tool} />)}
            </div>
            {message.content && <BotMessage message={message.content} />}
        </>
    );
}
