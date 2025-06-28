'use client';

import React, { useState, memo } from 'react';

import { cn } from '@/lib/utils';

import { BrainIcon, ChevronDownIcon, ChevronUpIcon, LoaderCircleIcon } from 'lucide-react';
import { UseChatHelpers } from '@ai-sdk/react';
import { UIMessage } from 'ai';
import { AnimatePresence, motion } from 'motion/react';
import { PreviewAttachment } from '@/components/chat/preview-attachment';
import { Markdown } from '@/components/chat/markdown';
import {
    ResearchTool,
    WebSearchTool,
    KnowledgeSearchTool,
    AcademicSearchTool,
} from '@/components/chat/tools';
import cx from 'classnames';
import { Button } from '@/components/ui/button';

interface MessageReasoningProps {
    isLoading: boolean;
    reasoning: string;
}

export function MessageReasoning({ isLoading, reasoning }: MessageReasoningProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="relative rounded-lg text-sm">
            <div
                className={cn('relative overflow-hidden transition-[max-height] duration-500', {
                    'max-h-24': !isExpanded,
                    'max-h-[500px]': isExpanded,
                })}
            >
                <div className="dark:text-neutral-400 text-neutral-600">
                    <Markdown>{reasoning}</Markdown>
                </div>
                {!isExpanded && (
                    <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-card to-transparent pointer-events-none" />
                )}
            </div>
            <div className="mt-2 flex items-center justify-center gap-2">
                <Button
                    onClick={() => setIsExpanded(!isExpanded)}
                    variant="ghost"
                    disabled={isLoading}
                    size={'sm'}
                    className="text-xs dark:!text-neutral-500 !text-neutral-600 overflow-hidden"
                >
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={isExpanded ? 'expanded' : 'collapsed'}
                            initial={{ y: isExpanded ? 15 : -15, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: isExpanded ? -15 : 15, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-center gap-2"
                        >
                            {isLoading && <LoaderCircleIcon className="animate-spin size-3" />}
                            {isExpanded ? (
                                <>
                                    Hide Reasoning
                                    <ChevronUpIcon className="size-3" />
                                </>
                            ) : (
                                <>
                                    Show Reasoning
                                    <ChevronDownIcon className="size-3" />
                                </>
                            )}
                        </motion.span>
                    </AnimatePresence>
                </Button>
            </div>
        </div>
    );
}

export function Message({
    chatId,
    message,
    isLoading,
    setMessages,
    reload,
    requiresScrollPadding,
}: {
    chatId: string;
    message: UIMessage;
    isLoading: boolean;
    setMessages: UseChatHelpers['setMessages'];
    reload: UseChatHelpers['reload'];
    requiresScrollPadding: boolean;
}) {
    return (
        <AnimatePresence>
            <motion.div
                data-testid={`message-${message.id}`}
                className="w-full mx-auto max-w-3xl px-4"
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                data-role={message.role}
            >
                <div
                    className={cn('flex gap-4 w-full', {
                        'my-10': message.role === 'user',
                    })}
                >
                    <div
                        className={cn('flex flex-col gap-4 w-full', {
                            'min-h-96': message.role === 'assistant' && requiresScrollPadding,
                        })}
                    >
                        {message.experimental_attachments &&
                            message.experimental_attachments.length > 0 && (
                                <div
                                    data-testid={`message-attachments`}
                                    className="flex flex-row justify-end gap-2"
                                >
                                    {message.experimental_attachments.map((attachment) => (
                                        <PreviewAttachment
                                            key={attachment.url}
                                            attachment={attachment}
                                        />
                                    ))}
                                </div>
                            )}

                        {message.parts?.map((part, index) => {
                            const { type } = part;
                            const key = `message-${message.id}-part-${index}`;

                            if (type === 'reasoning') {
                                return (
                                    <MessageReasoning
                                        key={key}
                                        isLoading={isLoading}
                                        reasoning={part.reasoning}
                                    />
                                );
                            }

                            if (type === 'text') {
                                return (
                                    <div
                                        key={key}
                                        className={cn('flex flex-row gap-2 w-full', {
                                            'justify-end': message.role == 'user',
                                        })}
                                    >
                                        <div
                                            data-testid="message-content"
                                            className={cn('flex flex-col gap-4', {
                                                'text-primary bg-neutral-900 border px-4 py-1 rounded-t-xl rounded-bl-xl overflow-auto':
                                                    message.role === 'user',
                                            })}
                                        >
                                            <Markdown>{part.text}</Markdown>
                                        </div>
                                    </div>
                                );
                            }

                            if (type === 'tool-invocation') {
                                const { toolInvocation } = part;
                                const { toolName, toolCallId, state } = toolInvocation;

                                if (state === 'call') {
                                    const { args } = toolInvocation;

                                    return (
                                        <div key={toolCallId}>
                                            {toolName === 'research' ? (
                                                <ResearchTool
                                                    toolCallId={toolCallId}
                                                    state={state}
                                                    args={args}
                                                />
                                            ) : toolName === 'web_search' ? (
                                                <WebSearchTool
                                                    toolCallId={toolCallId}
                                                    state={state}
                                                    args={args}
                                                />
                                            ) : toolName === 'knowledge_search' ? (
                                                <KnowledgeSearchTool
                                                    toolCallId={toolCallId}
                                                    state={state}
                                                    args={args}
                                                />
                                            ) : toolName === 'academic_search' ? (
                                                <AcademicSearchTool
                                                    toolCallId={toolCallId}
                                                    state={state}
                                                    args={args}
                                                />
                                            ) : null}
                                        </div>
                                    );
                                }

                                if (state === 'result') {
                                    const { result } = toolInvocation;

                                    return (
                                        <div key={toolCallId}>
                                            {toolName === 'research' ? (
                                                <ResearchTool
                                                    toolCallId={toolCallId}
                                                    state={state}
                                                    result={result}
                                                />
                                            ) : toolName === 'web_search' ? (
                                                <WebSearchTool
                                                    toolCallId={toolCallId}
                                                    state={state}
                                                    result={result}
                                                />
                                            ) : toolName === 'knowledge_search' ? (
                                                <KnowledgeSearchTool
                                                    toolCallId={toolCallId}
                                                    state={state}
                                                    result={result}
                                                />
                                            ) : toolName === 'academic_search' ? (
                                                <AcademicSearchTool
                                                    toolCallId={toolCallId}
                                                    state={state}
                                                    result={result}
                                                />
                                            ) : (
                                                <pre>{JSON.stringify(result, null, 2)}</pre>
                                            )}
                                        </div>
                                    );
                                }
                            }
                        })}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

export const PreviewMessage = memo(Message, (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.message.id !== nextProps.message.id) return false;
    if (prevProps.requiresScrollPadding !== nextProps.requiresScrollPadding) return false;
    if (prevProps.message.parts !== nextProps.message.parts) return false;

    return true;
});

export const ThinkingMessage = () => {
    const role = 'assistant';

    return (
        <motion.div
            data-testid="message-assistant-loading"
            className="w-full mx-auto max-w-3xl px-4 min-h-96"
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
            data-role={role}
        >
            <div className={cx('flex gap-4 w-full rounded-xl')}>
                <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
                    <BrainIcon size={14} />
                </div>

                <div className="flex flex-col gap-2 w-full">
                    <div className="flex flex-col gap-4 text-muted-foreground">Hmm...</div>
                </div>
            </div>
        </motion.div>
    );
};
