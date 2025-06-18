'use client';

import React, { useState, memo } from 'react';

import { cn } from '@/lib/utils';

import { BrainIcon, ChevronDownIcon, LoaderIcon } from 'lucide-react';
import { UseChatHelpers } from '@ai-sdk/react';
import { UIMessage } from 'ai';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { PreviewAttachment } from '@/components/chat/preview-attachment';
import { Markdown } from '@/components/chat/markdown';
import {
    ResearchTool,
    WebSearchTool,
    KnowledgeSearchTool,
    AcademicSearchTool,
} from '@/components/chat/tools';
import cx from 'classnames';

interface MessageReasoningProps {
    isLoading: boolean;
    reasoning: string;
}

export function MessageReasoning({ isLoading, reasoning }: MessageReasoningProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    const variants = {
        collapsed: {
            height: 0,
            opacity: 0,
            marginTop: 0,
            marginBottom: 0,
        },
        expanded: {
            height: 'auto',
            opacity: 1,
            marginTop: '1rem',
            marginBottom: '0.5rem',
        },
    };

    return (
        <div className="flex flex-col">
            {isLoading ? (
                <div className="flex flex-row gap-2 items-center">
                    <div className="font-medium">Reasoning</div>
                    <div className="animate-spin">
                        <LoaderIcon />
                    </div>
                </div>
            ) : (
                <div className="flex flex-row gap-2 items-center">
                    <div className="font-medium">Reasoned for a few seconds</div>
                    <button
                        data-testid="message-reasoning-toggle"
                        type="button"
                        className="cursor-pointer"
                        onClick={() => {
                            setIsExpanded(!isExpanded);
                        }}
                    >
                        <ChevronDownIcon />
                    </button>
                </div>
            )}

            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        data-testid="message-reasoning"
                        key="content"
                        initial="collapsed"
                        animate="expanded"
                        exit="collapsed"
                        variants={variants}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        style={{ overflow: 'hidden' }}
                        className="pl-4 text-zinc-600 dark:text-zinc-400 border-l flex flex-col gap-4"
                    >
                        <Markdown>{reasoning}</Markdown>
                    </motion.div>
                )}
            </AnimatePresence>
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
                                                'text-neutral-400 bg-neutral-900 border px-3 py-1 rounded-full text-right':
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
