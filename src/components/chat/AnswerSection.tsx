'use client';

import { motion } from 'motion/react';
import { BotMessage } from '@/components/chat/Message';
import { Text } from 'lucide-react';
import { CollapsibleMessage } from '@/components/chat/CollapsibleMessage';

export interface AnswerSectionProps {
    content: string;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    chatId?: string;
}

export function AnswerSection({ content, isOpen, onOpenChange, chatId }: AnswerSectionProps) {
    const header = (
        <div className="flex items-center gap-1">
            <Text />
            <div>Answer</div>
        </div>
    );

    const message = content ? (
        <div className="flex flex-col gap-1">
            <BotMessage message={content} />
        </div>
    ) : (
        <div></div>
    );

    return (
        <CollapsibleMessage
            role="assistant"
            isCollapsible={false}
            header={header}
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            showBorder={false}
        >
            {message}
        </CollapsibleMessage>
    );
}
