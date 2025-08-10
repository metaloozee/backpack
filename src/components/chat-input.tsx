'use client';

import * as React from 'react';

import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { cn } from '@/lib/utils';
import {
    CornerDownLeftIcon,
    StopCircleIcon,
    TelescopeIcon,
    PaperclipIcon,
    ChevronDownIcon,
    CheckIcon,
    MicIcon,
} from 'lucide-react';
import { usePathname } from 'next/navigation';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';

import { useLocalStorage } from 'usehooks-ts';
import {
    layoutTransition,
    staggerVariants,
    fadeVariants,
    slideVariants,
    transitions,
} from '@/lib/animations';
import { UseChatHelpers, UseCompletionHelpers } from '@ai-sdk/react';
import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import { ModelSelector } from '@/components/model-selector';
import { toast } from 'sonner';
import { useScrollToBottom } from '@/lib/hooks/use-scroll-to-bottom';
import { PreviewAttachment } from './chat/preview-attachment';
import { ScrollArea, ScrollBar } from './ui/scroll-area';
import { defaultTools, type ToolsState } from '@/lib/ai/tools';
import { Loader } from './ui/loader';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { useTRPC } from '@/lib/trpc/trpc';
import { Attachment, ChatMessage } from '@/lib/ai/types';

interface InputPanelProps {
    chatId: string;
    input: string;
    setInput: Dispatch<SetStateAction<string>>;
    status: UseChatHelpers<ChatMessage>['status'];
    stop: () => void;
    attachments: Array<Attachment>;
    setAttachments: Dispatch<SetStateAction<Attachment[]>>;
    messages: Array<ChatMessage>;
    setMessages: UseChatHelpers<ChatMessage>['setMessages'];
    sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
    tools: ToolsState;
    setTools: Dispatch<SetStateAction<ToolsState>>;
    initialModel?: string;
}

const modeTypes = [
    {
        value: 'ask',
        label: 'Ask',
        description: 'Standard mode with all features',
        tools: {
            webSearch: true,
            knowledgeSearch: true,
            academicSearch: true,
            financeSearch: true,
            newsSearch: true,
        },
        disabled: false,
    },
    {
        value: 'agent',
        label: 'Agent',
        description: 'Specialized for academic research',
        agents: {
            research: true,
        },
        disabled: false,
    },
] as const;

type ModeType = (typeof modeTypes)[number]['value'];

function PureInput({
    chatId,
    input,
    setInput,
    status,
    stop,
    attachments,
    setAttachments,
    messages,
    setMessages,
    sendMessage,
    tools,
    setTools,
    initialModel,
}: InputPanelProps) {
    const hour = new Date().getHours();
    let greeting = '';
    if (hour >= 5 && hour < 12) {
        greeting = "Let's rock the AM hustle";
    } else if (hour >= 12 && hour < 17) {
        greeting = 'Ready to punch the midday clock?';
    } else if ((hour >= 17 && hour <= 23) || hour < 5) {
        greeting = "Let's burn that midnight oil?";
    }

    const trpc = useTRPC();

    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const inputContainerRef = React.useRef<HTMLDivElement>(null);
    const [inputContainerHeight, setInputContainerHeight] = React.useState(0);
    const [isDragging, setIsDragging] = React.useState(false);

    React.useEffect(() => {
        const inputEl = inputContainerRef.current;

        if (inputEl) {
            const resizeObserver = new ResizeObserver(() => {
                setInputContainerHeight(inputEl.offsetHeight);
            });
            resizeObserver.observe(inputEl);
            return () => {
                resizeObserver.unobserve(inputEl);
            };
        }
    }, []);

    const adjustHeight = React.useCallback(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
        }
    }, []);

    const resetHeight = React.useCallback(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = '98px';
        }
    }, []);

    React.useEffect(() => {
        if (textareaRef.current) {
            adjustHeight();
        }
    }, [input, adjustHeight]);

    const [localStorageInput, setLocalStorageInput] = useLocalStorage('input', '');

    useEffect(() => {
        if (textareaRef.current) {
            const domValue = textareaRef.current.value;
            const finalValue = domValue || localStorageInput || '';
            setInput(finalValue);
            adjustHeight();
        }
    }, []);

    React.useEffect(() => {
        setLocalStorageInput(input);
    }, [input, setLocalStorageInput]);

    const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(event.target.value);
        adjustHeight();
    };

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

    const submitForm = React.useCallback(() => {
        window.history.replaceState({}, '', `/c/${chatId}`);

        if (!input.trim()) return;

        sendMessage({
            role: 'user',
            parts: [
                ...attachments.map((attachment) => ({
                    type: 'file' as const,
                    url: attachment.url,
                    name: attachment.name,
                    mediaType: attachment.contentType,
                })),
                {
                    type: 'text',
                    text: input,
                },
            ],
        });

        setAttachments([]);
        resetHeight();
        setInput('');
        textareaRef.current?.focus();
    }, [input, setInput, attachments, sendMessage, setAttachments, setLocalStorageInput, chatId]);

    const uploadFile = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/files/upload', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                const { url, pathname, contentType } = data;

                toast.success('File uploaded successfully!');

                return {
                    url,
                    name: pathname,
                    contentType: contentType,
                };
            }
            const { error } = await response.json();
            toast.error(error);
        } catch (error) {
            toast.error('Failed to upload file, please try again!');
        }
    };

    const handleFiles = useCallback(
        async (files: File[]) => {
            if (!files || files.length === 0) return;

            setUploadQueue((prev) => [...prev, ...files.map((file) => file.name)]);

            try {
                const uploadPromises = files.map((file) => uploadFile(file));
                const uploadedAttachments = (await Promise.all(uploadPromises)).filter(
                    Boolean
                ) as Attachment[];

                setAttachments((currentAttachments) => [
                    ...currentAttachments,
                    ...uploadedAttachments,
                ]);
            } catch (error) {
                console.error('Error uploading files!', error);
                toast.error('Failed to upload files, please try again!');
            } finally {
                setUploadQueue([]);
            }
        },
        [setAttachments]
    );

    const handleFileChange = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            const files = Array.from(event.target.files || []);
            await handleFiles(files);

            if (event.target) {
                event.target.value = '';
            }
        },
        [handleFiles]
    );

    const handleDrop = useCallback(
        async (event: React.DragEvent<HTMLDivElement>) => {
            event.preventDefault();
            event.stopPropagation();
            setIsDragging(false);

            const files = Array.from(event.dataTransfer.files);
            if (files.length > 0) {
                await handleFiles(files);
            }
        },
        [handleFiles]
    );

    const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();

        if (event.currentTarget.contains(event.relatedTarget as Node)) {
            return;
        }
        setIsDragging(false);
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const handlePaste = useCallback(
        async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
            const items = event.clipboardData.items;
            const files: File[] = [];
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.kind === 'file' && item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    if (file) {
                        files.push(file);
                    }
                }
            }

            if (files.length > 0) {
                event.preventDefault();
                await handleFiles(files);
                // toast.success(`${files.length} image(s) pasted and uploading.`);
            }
        },
        [handleFiles]
    );

    const [selectedMode, setSelectedMode] = React.useState<ModeType>('ask');
    const [selectedAgent, setSelectedAgent] = React.useState<string | null>(null);

    const pathname = usePathname();
    const isSpaceChat = pathname.startsWith('/s/');

    const updateTool = React.useCallback(
        (toolId: string, value: boolean) => {
            setTools((prev) => ({
                ...prev,
                [toolId]: value,
            }));
        },
        [setTools]
    );

    const handleModeChange = React.useCallback(
        (value: string) => {
            const newMode = value as ModeType;
            setSelectedMode(newMode);

            if (newMode === 'ask') {
                setSelectedAgent(null);
            }

            if (newMode === 'agent') {
                const clearedTools = Object.fromEntries(
                    defaultTools.map((tool) => [tool.id, false])
                ) as ToolsState;
                setTools(clearedTools);
            }
        },
        [setTools]
    );

    const isLoading = status === 'submitted' || status === 'streaming';

    const { isAtBottom, scrollToBottom } = useScrollToBottom();

    useEffect(() => {
        if (status === 'submitted') {
            scrollToBottom();
        }
    }, [status, scrollToBottom]);

    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    const transcribe = useMutation(trpc.chat.transcribe.mutationOptions());

    const cleanupRecorder = () => {
        if (mediaRecorderRef.current?.stream) {
            mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
        }
        mediaRecorderRef.current = null;
        setIsRecording(false);
    };

    const handleRecord = useCallback(async () => {
        setIsRecording(true);

        if (isRecording && mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            cleanupRecorder();
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const recorder = new MediaRecorder(stream);
                mediaRecorderRef.current = recorder;

                recorder.addEventListener('dataavailable', async (event) => {
                    if (event.data.size > 0) {
                        const audioBlob = event.data;

                        try {
                            setIsTranscribing(true);
                            const formData = new FormData();
                            formData.append('audio', audioBlob, 'audio.webm');

                            const { text } = await transcribe.mutateAsync(formData);

                            setInput(text);
                            setIsTranscribing(false);
                            setIsRecording(false);
                        } catch (error) {
                            setIsTranscribing(false);
                            toast.error('Failed to transcribe audio, please try again!');
                        } finally {
                            cleanupRecorder();
                        }
                    }
                });

                recorder.addEventListener('stop', () => {
                    stream.getTracks().forEach((track) => track.stop());
                });

                recorder.start();
                setIsRecording(true);
            } catch (error) {
                setIsRecording(false);
                console.error('Error recording audio', error);
                toast.error('Failed to record audio, please try again!');
            }
        }
    }, [isRecording, isTranscribing, cleanupRecorder, setInput]);

    return (
        <motion.div
            layout
            transition={layoutTransition}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            className={cn(
                'w-full bg-background sticky',
                messages.length > 0
                    ? 'bottom-0 left-0 right-0'
                    : isSpaceChat
                      ? 'mt-20'
                      : 'flex flex-col items-center justify-center'
            )}
        >
            <AnimatePresence>
                {isDragging && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-neutral-950/50 backdrop-blur-sm flex items-center justify-center pointer-events-none"
                    >
                        <div className="text-white text-2xl font-semibold">
                            Drop files to upload
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <input
                type="file"
                className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
                ref={fileInputRef}
                multiple
                onChange={handleFileChange}
                tabIndex={-1}
            />

            <AnimatePresence>
                {messages.length === 0 && !isSpaceChat && (
                    <motion.div
                        variants={slideVariants.down}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="mb-6"
                    >
                        <h1 className="text-3xl text-transparent bg-clip-text bg-linear-to-br from-white to-neutral-500">
                            {greeting}
                        </h1>
                    </motion.div>
                )}
                {messages.length > 0 && !isAtBottom && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className="absolute left-1/2 -translate-x-1/2 bg-background/40 rounded-full backdrop-blur-md"
                        style={{ bottom: `${inputContainerHeight + 16}px` }}
                    >
                        <Button
                            data-testid="scroll-to-bottom-button"
                            className="rounded-full !bg-transparent border"
                            size={'sm'}
                            variant="secondary"
                            onClick={(event) => {
                                event.preventDefault();
                                scrollToBottom();
                            }}
                        >
                            <p className="text-xs font-normal">Scroll to bottom</p>
                            <ChevronDownIcon className="size-3" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div ref={inputContainerRef} className={cn('max-w-3xl w-full mx-auto')}>
                {(attachments.length > 0 || uploadQueue.length > 0) && (
                    <div className="mx-6 p-2 border-b-0 border rounded-t-md bg-neutral-900/50">
                        <ScrollArea>
                            <motion.div
                                data-testid="attachments-preview"
                                className="flex flex-row gap-2 items-end justify-start"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{ delay: 0.2 }}
                            >
                                {attachments.map((attachment) => (
                                    <PreviewAttachment
                                        key={attachment.url}
                                        attachment={attachment}
                                    />
                                ))}
                                {uploadQueue.map((fileName) => (
                                    <PreviewAttachment
                                        key={fileName}
                                        attachment={{
                                            url: '',
                                            name: fileName,
                                            contentType: '',
                                        }}
                                        isUploading={true}
                                    />
                                ))}
                            </motion.div>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </div>
                )}
                <div
                    className={cn(
                        'relative mb-2 flex flex-col w-full p-4 border rounded-lg bg-neutral-900/50 focus-within:border-neutral-700/70 hover:border-neutral-700/70 transition-all duration-200'
                    )}
                >
                    <Textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleInput}
                        onPaste={handlePaste}
                        onKeyDown={(event) => {
                            if (
                                event.key === 'Enter' &&
                                !event.shiftKey &&
                                !event.nativeEvent.isComposing
                            ) {
                                event.preventDefault();

                                if (status !== 'ready') {
                                    toast.error(
                                        'Please wait for the model to finish its response!'
                                    );
                                } else {
                                    submitForm();
                                }
                            }
                        }}
                        placeholder="Ask me anything..."
                        autoFocus
                        tabIndex={0}
                        spellCheck={true}
                        className="resize-none w-full bg-transparent ring-0 border-0 text-sm placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
                    />

                    <div className="w-full flex justify-between items-center">
                        <motion.div
                            layout
                            className="flex flex-row justify-start items-center gap-2"
                            transition={transitions.smooth}
                        >
                            <motion.div
                                variants={slideVariants.up}
                                initial="hidden"
                                animate="visible"
                                transition={transitions.smooth}
                            >
                                <Tabs value={selectedMode} onValueChange={handleModeChange}>
                                    <TabsList className="bg-neutral-950">
                                        {modeTypes.map((mode) => (
                                            <TabsTrigger
                                                key={mode.value}
                                                value={mode.value}
                                                disabled={mode.disabled}
                                                className="text-xs"
                                            >
                                                <div className="inline-flex items-center gap-1">
                                                    <span>{mode.label}</span>
                                                    {(mode.value === 'ask' ||
                                                        mode.value === 'agent') && (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <span
                                                                    onClick={(event) => {
                                                                        event.stopPropagation();
                                                                    }}
                                                                    onMouseDown={(event) => {
                                                                        event.stopPropagation();
                                                                    }}
                                                                    onPointerDown={(event) => {
                                                                        event.stopPropagation();
                                                                    }}
                                                                    className={cn(
                                                                        'ml-1 inline-flex items-center justify-center rounded-sm ',
                                                                        'hover:bg-neutral-900'
                                                                    )}
                                                                    role="button"
                                                                    tabIndex={0}
                                                                >
                                                                    <ChevronDownIcon className="size-3" />
                                                                </span>
                                                            </DropdownMenuTrigger>
                                                            {mode.value === 'ask' ? (
                                                                <DropdownMenuContent
                                                                    align="start"
                                                                    className="w-xs bg-neutral-950 border-neutral-800"
                                                                >
                                                                    {defaultTools.map((tool) => {
                                                                        const IconComponent =
                                                                            tool.icon;
                                                                        return (
                                                                            <DropdownMenuItem
                                                                                key={tool.id}
                                                                                className="flex items-center justify-between p-3 cursor-pointer hover:bg-neutral-800"
                                                                                onClick={(e) =>
                                                                                    e.preventDefault()
                                                                                }
                                                                            >
                                                                                <div className="flex items-center gap-3">
                                                                                    <IconComponent className="size-4 text-muted-foreground" />
                                                                                    <div className="flex flex-col">
                                                                                        <span className="text-sm font-medium">
                                                                                            {
                                                                                                tool.name
                                                                                            }
                                                                                        </span>
                                                                                        <span className="text-xs text-muted-foreground">
                                                                                            {
                                                                                                tool.description
                                                                                            }
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                                <Switch
                                                                                    checked={
                                                                                        tools[
                                                                                            tool.id
                                                                                        ] || false
                                                                                    }
                                                                                    onCheckedChange={(
                                                                                        checked
                                                                                    ) =>
                                                                                        updateTool(
                                                                                            tool.id,
                                                                                            checked
                                                                                        )
                                                                                    }
                                                                                />
                                                                            </DropdownMenuItem>
                                                                        );
                                                                    })}
                                                                </DropdownMenuContent>
                                                            ) : (
                                                                <DropdownMenuContent
                                                                    align="start"
                                                                    className="w-xs bg-neutral-950 border-neutral-800"
                                                                >
                                                                    {Object.entries(
                                                                        modeTypes.find(
                                                                            (m) =>
                                                                                m.value === 'agent'
                                                                        )?.agents || {}
                                                                    ).map(([agentKey, enabled]) => {
                                                                        if (!enabled) return null;
                                                                        const isSelected =
                                                                            selectedAgent ===
                                                                            agentKey;
                                                                        return (
                                                                            <DropdownMenuItem
                                                                                key={agentKey}
                                                                                className="flex items-center justify-between p-3 cursor-pointer hover:bg-neutral-800"
                                                                                onSelect={(e) => {
                                                                                    e.preventDefault();
                                                                                    setSelectedAgent(
                                                                                        (prev) =>
                                                                                            prev ===
                                                                                            agentKey
                                                                                                ? null
                                                                                                : agentKey
                                                                                    );
                                                                                }}
                                                                            >
                                                                                <div className="flex items-center gap-3">
                                                                                    <TelescopeIcon className="size-4 text-muted-foreground" />
                                                                                    <div className="flex flex-col">
                                                                                        <span className="text-sm font-medium">
                                                                                            {agentKey
                                                                                                .charAt(
                                                                                                    0
                                                                                                )
                                                                                                .toUpperCase() +
                                                                                                agentKey.slice(
                                                                                                    1
                                                                                                )}
                                                                                        </span>
                                                                                        <span className="text-xs text-muted-foreground">
                                                                                            {agentKey
                                                                                                .charAt(
                                                                                                    0
                                                                                                )
                                                                                                .toUpperCase() +
                                                                                                agentKey.slice(
                                                                                                    1
                                                                                                )}{' '}
                                                                                            agent
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                                {isSelected && (
                                                                                    <CheckIcon className="size-4 text-primary" />
                                                                                )}
                                                                            </DropdownMenuItem>
                                                                        );
                                                                    })}
                                                                </DropdownMenuContent>
                                                            )}
                                                        </DropdownMenu>
                                                    )}
                                                </div>
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                </Tabs>
                            </motion.div>
                            <div className="relative flex gap-2 w-[200px]">
                                <AnimatePresence initial={false}>
                                    {selectedMode === 'ask' &&
                                        defaultTools
                                            .filter((t) => tools[t.id])
                                            .map((t) => {
                                                const Icon = t.icon;
                                                return (
                                                    <motion.div
                                                        key={`selected-tool-${t.id}`}
                                                        initial={{ opacity: 0, scale: 0.9, y: 2 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.9, y: -2 }}
                                                        transition={transitions.smooth}
                                                        layout
                                                    >
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div className="size-6 rounded-full border border-neutral-800 bg-neutral-900 flex items-center justify-center">
                                                                        <Icon className="size-3.5 text-muted-foreground" />
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <span className="text-xs">
                                                                        {t.name}
                                                                    </span>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </motion.div>
                                                );
                                            })}
                                </AnimatePresence>
                            </div>
                        </motion.div>

                        <motion.div
                            variants={fadeVariants}
                            initial="hidden"
                            animate="visible"
                            transition={transitions.smooth}
                        >
                            <AnimatePresence>
                                <div className="flex items-center gap-2">
                                    <AttachmentButton fileInputRef={fileInputRef} status={status} />

                                    <motion.div variants={fadeVariants} className="flex-shrink-0">
                                        <ModelSelector initialModel={initialModel} />
                                    </motion.div>

                                    {isLoading ? (
                                        <StopButton stop={stop} setMessages={setMessages} />
                                    ) : (
                                        <SendButton
                                            input={input}
                                            submitForm={submitForm}
                                            handleRecord={handleRecord}
                                            isRecording={isRecording}
                                            isTranscribing={isTranscribing}
                                        />
                                    )}
                                </div>
                            </AnimatePresence>
                        </motion.div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

const AttachmentButton = React.memo(
    ({
        fileInputRef,
        status,
    }: {
        fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
        status: UseChatHelpers<ChatMessage>['status'];
    }) => (
        <Button
            variant={'ghost'}
            className="flex-shrink-0"
            onClick={(event) => {
                event.preventDefault();
                fileInputRef.current?.click();
            }}
            disabled={status !== 'ready'}
        >
            <PaperclipIcon className="size-3 text-muted-foreground" />
        </Button>
    )
);

AttachmentButton.displayName = 'AttachmentButton';

const StopButton = React.memo(
    ({ stop, setMessages }: { stop: () => void; setMessages: (messages: any) => void }) => (
        <Button
            variant={'destructive'}
            onClick={(event) => {
                event.preventDefault();
                stop();
                setMessages((messages: any) => messages);
            }}
        >
            <motion.div
                variants={slideVariants.up}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={transitions.smooth}
            >
                <StopCircleIcon />
            </motion.div>
        </Button>
    )
);

StopButton.displayName = 'StopButton';

const SendButton = React.memo(
    ({
        input,
        submitForm,
        handleRecord,
        isRecording,
        isTranscribing,
    }: {
        input: string;
        submitForm: () => void;
        handleRecord: () => void;
        isRecording: boolean;
        isTranscribing: boolean;
    }) => (
        <motion.div
            variants={fadeVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={transitions.smooth}
        >
            {input.trim().length <= 0 ? (
                <Button
                    className="px-4"
                    onClick={handleRecord}
                    disabled={isTranscribing}
                    variant={isRecording ? 'destructive' : 'default'}
                >
                    <motion.div
                        variants={slideVariants.up}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={transitions.smooth}
                    >
                        <AnimatePresence mode="wait">
                            {isTranscribing ? (
                                <motion.div
                                    key="transcribing-icon"
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    transition={transitions.smooth}
                                >
                                    <Loader variant={'secondary'} />
                                </motion.div>
                            ) : isRecording ? (
                                <motion.div
                                    key="stop-recording-icon"
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    transition={transitions.smooth}
                                >
                                    <StopCircleIcon />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="audio-icon"
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    transition={transitions.smooth}
                                >
                                    <MicIcon />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </Button>
            ) : (
                <Button
                    className="px-4"
                    onClick={(event) => {
                        event.preventDefault();
                        submitForm();
                    }}
                >
                    <motion.div
                        variants={slideVariants.up}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={transitions.smooth}
                    >
                        <AnimatePresence mode="wait">
                            {input.trim().length > 0 ? (
                                <motion.div
                                    key="send-icon"
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    transition={transitions.smooth}
                                >
                                    <CornerDownLeftIcon />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="send-icon-fallback"
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    transition={transitions.smooth}
                                >
                                    <CornerDownLeftIcon />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </Button>
            )}
        </motion.div>
    )
);

SendButton.displayName = 'SendButton';

export const Input = React.memo(PureInput, (prevProps, nextProps) => {
    if (prevProps.status !== nextProps.status) return false;
    if (prevProps.messages.length !== nextProps.messages.length) return false;
    if (prevProps.input !== nextProps.input) return false;
    if (JSON.stringify(prevProps.tools) !== JSON.stringify(nextProps.tools)) return false;

    return true;
});

Input.displayName = 'Input';
