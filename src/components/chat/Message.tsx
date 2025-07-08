'use client';

import React, { useState, memo, useEffect } from 'react';
import { useCopyToClipboard } from 'usehooks-ts';

import equal from 'fast-deep-equal';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import {
    ChevronDownIcon,
    ChevronUpIcon,
    CopyIcon,
    LoaderCircleIcon,
    PencilIcon,
    PencilLineIcon,
    CheckIcon,
} from 'lucide-react';
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
    ExtractTool,
} from '@/components/chat/tools';
import { Button } from '@/components/ui/button';
import { Disclosure, DisclosureTrigger } from '@/components/ui/disclosure';
import { MessageActions } from '@/components/chat/message-actions';
import { MessageEditor } from './message-editor';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { transitions } from '@/lib/animations';

interface MessageReasoningProps {
    isLoading: boolean;
    reasoning: string;
}

export function MessageReasoning({ isLoading, reasoning }: MessageReasoningProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <Disclosure
            open={isExpanded}
            onOpenChange={setIsExpanded}
            className="relative rounded-lg text-sm"
        >
            <motion.div
                className="relative overflow-hidden"
                animate={{
                    height: isExpanded ? 'auto' : 96,
                }}
            >
                <div className="dark:text-neutral-400 text-neutral-600">
                    <Markdown>{reasoning}</Markdown>
                </div>
                {!isExpanded && (
                    <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-background to-transparent pointer-events-none" />
                )}
            </motion.div>

            <div className="mt-2 flex items-center justify-center gap-2">
                <DisclosureTrigger>
                    <Button
                        variant="ghost"
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
                </DisclosureTrigger>
            </div>
        </Disclosure>
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
    const [mode, setMode] = useState<'view' | 'edit'>('view');
    const [_, copyToClipboard] = useCopyToClipboard();
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        if (isCopied) {
            const timer = setTimeout(() => {
                setIsCopied(false);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isCopied]);

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
                                    <div key={key} className="w-full">
                                        <AnimatePresence mode="wait" initial={false}>
                                            {mode === 'view' ? (
                                                <motion.div
                                                    key="view"
                                                    initial={{ opacity: 0.5, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0.5, height: 0 }}
                                                    transition={{
                                                        duration: 0.3,
                                                        ease: 'easeInOut',
                                                    }}
                                                    style={{ overflow: 'hidden' }}
                                                >
                                                    <div
                                                        className={cn(
                                                            'group/message flex flex-row gap-2 w-full items-center',
                                                            {
                                                                'justify-end':
                                                                    message.role == 'user',
                                                            }
                                                        )}
                                                    >
                                                        {message.role == 'user' && (
                                                            <TooltipProvider delayDuration={200}>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            data-testid="message-edit-button"
                                                                            size={'icon'}
                                                                            variant="ghost"
                                                                            className="rounded opacity-0 group-hover/message:opacity-100 transition-all duration-200 ease-in-out"
                                                                            onClick={() => {
                                                                                setMode('edit');
                                                                            }}
                                                                        >
                                                                            <PencilLineIcon className="size-3" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent sideOffset={10}>
                                                                        Edit Message
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            data-testid="message-copy-button"
                                                                            size={'icon'}
                                                                            variant="ghost"
                                                                            className="rounded opacity-0 group-hover/message:opacity-100 transition-all duration-200 ease-in-out"
                                                                            onClick={async () => {
                                                                                const textFromParts =
                                                                                    message.parts
                                                                                        ?.filter(
                                                                                            (
                                                                                                part
                                                                                            ) =>
                                                                                                part.type ==
                                                                                                'text'
                                                                                        )
                                                                                        .map(
                                                                                            (
                                                                                                part
                                                                                            ) =>
                                                                                                part.text
                                                                                        )
                                                                                        .join('\n')
                                                                                        .trim();

                                                                                if (
                                                                                    !textFromParts
                                                                                ) {
                                                                                    return toast.error(
                                                                                        'There is no text to copy.'
                                                                                    );
                                                                                }

                                                                                await copyToClipboard(
                                                                                    textFromParts
                                                                                );
                                                                                setIsCopied(true);
                                                                            }}
                                                                        >
                                                                            <AnimatePresence
                                                                                mode="wait"
                                                                                initial={false}
                                                                            >
                                                                                {isCopied ? (
                                                                                    <motion.div
                                                                                        key="check"
                                                                                        initial={{
                                                                                            scale: 0,
                                                                                            opacity: 0,
                                                                                            rotate: -180,
                                                                                        }}
                                                                                        animate={{
                                                                                            scale: 1,
                                                                                            opacity: 1,
                                                                                            rotate: 0,
                                                                                        }}
                                                                                        exit={{
                                                                                            scale: 0,
                                                                                            opacity: 0,
                                                                                            rotate: 180,
                                                                                        }}
                                                                                        transition={
                                                                                            transitions.bouncy
                                                                                        }
                                                                                    >
                                                                                        <CheckIcon className="size-3" />
                                                                                    </motion.div>
                                                                                ) : (
                                                                                    <motion.div
                                                                                        key="copy"
                                                                                        initial={{
                                                                                            scale: 0,
                                                                                            opacity: 0,
                                                                                            rotate: -180,
                                                                                        }}
                                                                                        animate={{
                                                                                            scale: 1,
                                                                                            opacity: 1,
                                                                                            rotate: 0,
                                                                                        }}
                                                                                        exit={{
                                                                                            scale: 0,
                                                                                            opacity: 0,
                                                                                            rotate: 180,
                                                                                        }}
                                                                                        transition={
                                                                                            transitions.smooth
                                                                                        }
                                                                                    >
                                                                                        <CopyIcon className="size-3" />
                                                                                    </motion.div>
                                                                                )}
                                                                            </AnimatePresence>
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent sideOffset={10}>
                                                                        <p>
                                                                            {isCopied
                                                                                ? 'Copied!'
                                                                                : 'Copy message'}
                                                                        </p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        )}
                                                        <div
                                                            data-testid="message-content"
                                                            className={cn(
                                                                'flex flex-col gap-4',
                                                                {
                                                                    'text-primary bg-neutral-900 border px-4 py-1 overflow-auto':
                                                                        message.role === 'user',
                                                                },
                                                                message.experimental_attachments &&
                                                                    message.experimental_attachments
                                                                        .length > 0
                                                                    ? 'rounded-b-xl rounded-tl-xl'
                                                                    : 'rounded-t-xl rounded-bl-xl'
                                                            )}
                                                        >
                                                            <Markdown>{part.text}</Markdown>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="edit"
                                                    initial={{ opacity: 0.5, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0.5, height: 0 }}
                                                    transition={{
                                                        duration: 0.3,
                                                        ease: 'easeInOut',
                                                    }}
                                                    style={{ overflow: 'hidden' }}
                                                >
                                                    <MessageEditor
                                                        key={message.id}
                                                        message={message}
                                                        setMode={setMode}
                                                        setMessages={setMessages}
                                                        reload={reload}
                                                    />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
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
                                            ) : toolName === 'extract' ? (
                                                <ExtractTool
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
                                            ) : toolName === 'extract' ? (
                                                <ExtractTool
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

                        <MessageActions chatId={chatId} message={message} isLoading={isLoading} />
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

export const PreviewMessage = memo(Message, (prevProps, nextProps) => {
    if (!equal(prevProps.isLoading, nextProps.isLoading)) return false;
    if (!equal(prevProps.message.id, nextProps.message.id)) return false;
    if (!equal(prevProps.requiresScrollPadding, nextProps.requiresScrollPadding)) return false;
    if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;

    return true;
});
