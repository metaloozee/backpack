'use client';

import * as React from 'react';

import { motion, AnimatePresence } from 'motion/react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { CoreMessage, Message } from 'ai';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    Check,
    ChevronDownIcon,
    CornerDownLeftIcon,
    Brain,
    StopCircleIcon,
    BookOpenTextIcon,
    GlobeIcon,
    BookCopyIcon,
    GraduationCapIcon,
    FlaskConical,
    SparklesIcon,
    UsersIcon,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandList, CommandGroup, CommandItem } from '@/components/ui/command';
import { usePathname } from 'next/navigation';
import { ChatData } from '@/app/(main)/(spaces)/s/[id]/page';
import { Separator } from './ui/separator';
import { Chat } from '@/lib/db/schema/app';
import { convertToUIMessages } from '@/lib/ai/convertToUIMessages';
import ChatDisplayCard from './chat/DisplayCard';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { useForm, SubmitHandler } from 'react-hook-form';
import {
    layoutTransition,
    staggerVariants,
    fadeVariants,
    buttonVariants,
    slideVariants,
    transitions,
} from '@/lib/animations';

interface InputPanelProps {
    isLoading: boolean;
    messages: Array<Message>;
    setMessages: (messages: Array<Message>) => void;
    query?: string;
    stop: () => void;
    append: (message: any) => void;

    webSearch: boolean;
    setWebSearch: (webSearch: boolean) => void;

    knowledgeBase: boolean;
    setKnowledgeBase: (knowledgeBase: boolean) => void;

    academicSearch: boolean;
    setAcademicSearch: (academicSearch: boolean) => void;

    socialSearch: boolean;
    setSocialSearch: (socialSearch: boolean) => void;

    chatsData?: Array<ChatData>;
}

const modeTypes = [
    {
        value: 'ask',
        label: 'Ask',
        description: 'Standard mode with all features',
        showWebSearch: true,
        showKnowledgeBase: true,
        showAcademicSearch: true,
        showSocialSearch: true,
        disabled: false,
    },
    {
        value: 'research',
        label: 'Research',
        description: 'Specialized for academic research',
        showWebSearch: true,
        showKnowledgeBase: true,
        showAcademicSearch: true,
        showSocialSearch: true,
        disabled: false,
    },
] as const;

type ModeType = (typeof modeTypes)[number]['value'];

interface FormValues {
    prompt: string;
}

export function Input({
    isLoading,
    messages,
    setMessages,
    query,
    stop,
    append,
    chatsData,

    webSearch,
    setWebSearch,
    knowledgeBase,
    setKnowledgeBase,
    academicSearch,
    setAcademicSearch,
    socialSearch,
    setSocialSearch,
}: InputPanelProps) {
    const { register, handleSubmit: handleHookFormSubmit, reset, watch } = useForm<FormValues>();
    const promptValue = watch('prompt');

    const pathname = usePathname();
    const isSpaceChat = pathname.startsWith('/s/');

    const updateWebSearch = (value: boolean) => {
        if (typeof setWebSearch === 'function') {
            setWebSearch(value);
        }
    };

    const updateKnowledgeBase = (value: boolean) => {
        if (typeof setKnowledgeBase === 'function') {
            setKnowledgeBase(value);
        }
    };

    const updateAcademicSearch = (value: boolean) => {
        if (typeof setAcademicSearch === 'function') {
            setAcademicSearch(value);
        }
    };

    const updateSocialSearch = (value: boolean) => {
        if (typeof setSocialSearch === 'function') {
            setSocialSearch(value);
        }
    };

    const [showEmptyScreen, setShowEmptyScreen] = React.useState(false);
    const router = useRouter();
    const inputRef = React.useRef<HTMLTextAreaElement>(null);
    const isFirstMessage = React.useRef(true);

    const [isComposing, setIsComposing] = React.useState(false);
    const [enterDisabled, setEnterDisabled] = React.useState(false);

    const [selectedMode, setSelectedMode] = React.useState<ModeType>('ask');

    const handlerCompositionStart = () => setIsComposing(true);

    const handleCompositionEnd = () => {
        setIsComposing(false);
        setEnterDisabled(true);

        setTimeout(() => {
            setEnterDisabled(false);
        }, 300);
    };

    const handleNewChat = () => {
        setMessages([]);
        router.push('/');
    };

    const handleModeChange = (value: string) => {
        const newMode = value as ModeType;
        setSelectedMode(newMode);
        console.log('Mode switched to:', newMode);

        const selectedModeConfig = modeTypes.find((m) => m.value === newMode);
        if (selectedModeConfig) {
            updateWebSearch(selectedModeConfig.showWebSearch);
            updateKnowledgeBase(selectedModeConfig.showKnowledgeBase);
            updateAcademicSearch(selectedModeConfig.showAcademicSearch);
            updateSocialSearch(selectedModeConfig.showSocialSearch);
        }
    };

    React.useEffect(() => {
        if (isFirstMessage.current && query && query.trim().length > 0) {
            append({
                role: 'user',
                content: query,
            });
            isFirstMessage.current = false;
        }
    }, [query]);

    const onSubmit: SubmitHandler<FormValues> = (data) => {
        const trimmedPrompt = data.prompt.trim();
        if (trimmedPrompt.length === 0) return;

        append({
            role: 'user',
            content: trimmedPrompt,
        });
        reset();
    };

    return (
        <motion.div
            layout
            transition={layoutTransition}
            className={cn(
                'mx-auto w-full bg-background',
                messages.length > 0
                    ? 'bottom-0 left-0 right-0'
                    : isSpaceChat
                      ? 'pt-20'
                      : 'flex flex-col items-center justify-center'
            )}
        >
            {messages.length === 0 && !isSpaceChat && (
                <motion.div
                    variants={slideVariants.down}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="mb-6"
                >
                    <h1 className="text-3xl text-transparent bg-clip-text bg-linear-to-br from-white to-neutral-500">
                        Your Research, Simplified.
                    </h1>
                </motion.div>
            )}
            <form
                onSubmit={handleHookFormSubmit(onSubmit)}
                className={cn(isSpaceChat ? 'max-w-2xl w-full' : 'max-w-3xl w-full mx-auto')}
            >
                <div
                    className={cn(
                        'relative flex flex-col w-full p-4 gap-4 border-input bg-neutral-900/50 focus-within:border-neutral-700/70 hover:border-neutral-700/70 transition-all duration-200',
                        messages.length > 0
                            ? 'border-t-2 border-x-2 rounded-t-lg'
                            : 'border-2 rounded-lg'
                    )}
                >
                    <Textarea
                        autoFocus
                        rows={2}
                        tabIndex={0}
                        onCompositionStart={handlerCompositionStart}
                        onCompositionEnd={handleCompositionEnd}
                        placeholder="Ask me anything..."
                        spellCheck={true}
                        className="resize-none w-full bg-transparent ring-0 border-0 text-sm placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
                        {...register('prompt')}
                        onKeyDown={(e) => {
                            if (
                                e.key === 'Enter' &&
                                !e.shiftKey &&
                                !isComposing &&
                                !enterDisabled
                            ) {
                                const currentValue = (e.target as HTMLTextAreaElement).value;
                                if (currentValue.trim().length === 0) {
                                    e.preventDefault();
                                    return;
                                }

                                e.preventDefault();
                                handleHookFormSubmit(onSubmit)();
                            }
                        }}
                        onFocus={() => setShowEmptyScreen(true)}
                        onBlur={() => setShowEmptyScreen(false)}
                    />

                    <div className="w-full flex justify-between items-center">
                        <div className="flex flex-row justify-start items-center gap-2">
                            <motion.div
                                variants={slideVariants.up}
                                initial="hidden"
                                animate="visible"
                                transition={transitions.smooth}
                            >
                                <Tabs
                                    value={selectedMode}
                                    onValueChange={handleModeChange}
                                    className="w-auto"
                                >
                                    <TabsList className="grid w-full grid-cols-2 bg-neutral-800">
                                        {modeTypes.map((mode) => (
                                            <TabsTrigger
                                                key={mode.value}
                                                value={mode.value}
                                                disabled={mode.disabled || messages.length !== 0}
                                                className="text-xs"
                                            >
                                                {mode.label}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                </Tabs>
                            </motion.div>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    className="flex flex-row gap-2"
                                    variants={staggerVariants.container}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    key={`cards-container-${selectedMode}`}
                                >
                                    {modeTypes.find((m) => m.value === selectedMode && !m.disabled)
                                        ?.showWebSearch && (
                                        <motion.div
                                            variants={staggerVariants.item}
                                            key="web-search-card"
                                            layout
                                            layoutId="web-search-section"
                                        >
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div
                                                            onClick={() =>
                                                                updateWebSearch(!webSearch)
                                                            }
                                                            className={cn(
                                                                'cursor-pointer text-muted-foreground px-4 py-2 rounded-md border-2 flex justify-center items-center gap-2 text-xs transition-all duration-200',
                                                                webSearch
                                                                    ? 'bg-neutral-800 border-neutral-800 text-primary'
                                                                    : 'bg-neutral-900 border-neutral-800'
                                                            )}
                                                        >
                                                            <GlobeIcon className="size-3.5" />
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Web Search</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </motion.div>
                                    )}
                                    {modeTypes.find((m) => m.value === selectedMode && !m.disabled)
                                        ?.showKnowledgeBase && (
                                        <motion.div
                                            variants={staggerVariants.item}
                                            key="knowledge-base-card"
                                            layout
                                            layoutId="knowledge-base-section"
                                        >
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div
                                                            onClick={() =>
                                                                updateKnowledgeBase(!knowledgeBase)
                                                            }
                                                            className={cn(
                                                                'cursor-pointer text-muted-foreground px-4 py-2 rounded-md border-2 flex justify-center items-center gap-2 text-xs transition-all duration-200',
                                                                knowledgeBase
                                                                    ? 'bg-neutral-800 border-neutral-800 text-primary'
                                                                    : 'bg-neutral-900 border-neutral-800'
                                                            )}
                                                        >
                                                            <BookCopyIcon className="size-3.5" />
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Knowledge Base</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </motion.div>
                                    )}
                                    {modeTypes.find((m) => m.value === selectedMode && !m.disabled)
                                        ?.showAcademicSearch && (
                                        <motion.div
                                            variants={staggerVariants.item}
                                            key="academic-search-card"
                                            layout
                                            layoutId="academic-search-section"
                                        >
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div
                                                            onClick={() =>
                                                                updateAcademicSearch(
                                                                    !academicSearch
                                                                )
                                                            }
                                                            className={cn(
                                                                'cursor-pointer text-muted-foreground px-4 py-2 rounded-md border-2 flex justify-center items-center gap-2 text-xs transition-all duration-200',
                                                                academicSearch
                                                                    ? 'bg-neutral-800 border-neutral-800 text-primary'
                                                                    : 'bg-neutral-900 border-neutral-800'
                                                            )}
                                                        >
                                                            <GraduationCapIcon className="size-3.5" />
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Academic Search</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </motion.div>
                                    )}
                                    {modeTypes.find((m) => m.value === selectedMode && !m.disabled)
                                        ?.showSocialSearch && (
                                        <motion.div
                                            variants={staggerVariants.item}
                                            key="x-search-card"
                                            layout
                                            layoutId="x-search-section"
                                        >
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div
                                                            onClick={() =>
                                                                updateSocialSearch(!socialSearch)
                                                            }
                                                            className={cn(
                                                                'cursor-pointer text-muted-foreground px-4 py-2 rounded-md border-2 flex justify-center items-center gap-2 text-xs transition-all duration-200',
                                                                socialSearch
                                                                    ? 'bg-neutral-800 border-neutral-800 text-primary'
                                                                    : 'bg-neutral-900 border-neutral-800'
                                                            )}
                                                        >
                                                            <UsersIcon className="size-3.5" />
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Social Search</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </motion.div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <motion.div
                            variants={fadeVariants}
                            initial="hidden"
                            animate="visible"
                            transition={transitions.smooth}
                        >
                            <AnimatePresence>
                                {isLoading ? (
                                    <Button
                                        size={'sm'}
                                        variant={'destructive'}
                                        onClick={stop}
                                        disabled={!isLoading}
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
                                ) : (
                                    <Button
                                        className="px-4"
                                        size={'sm'}
                                        type="submit"
                                        disabled={
                                            !promptValue ||
                                            promptValue.trim().length === 0 ||
                                            isLoading
                                        }
                                        variant={
                                            promptValue && promptValue.trim().length > 0
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        <motion.div
                                            variants={slideVariants.up}
                                            initial="hidden"
                                            animate="visible"
                                            exit="exit"
                                            transition={transitions.smooth}
                                        >
                                            <CornerDownLeftIcon
                                                className={cn(
                                                    promptValue && promptValue.trim().length > 0
                                                        ? 'text-background'
                                                        : 'text-muted-foreground'
                                                )}
                                            />
                                        </motion.div>
                                    </Button>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </div>
                </div>
            </form>

            {messages.length === 0 && chatsData && chatsData.length > 0 && (
                <div className="mt-12 space-y-5 max-w-2xl">
                    <div className="space-y-4 w-full">
                        <h1 className="text-lg w-full flex gap-2 items-center">
                            <BookOpenTextIcon /> Recent Chats
                        </h1>
                        <Separator />
                    </div>
                    <motion.div
                        variants={staggerVariants.container}
                        initial="hidden"
                        animate="visible"
                        className="flex flex-col w-full justify-start items-start gap-3"
                    >
                        <AnimatePresence>
                            {chatsData.map((chat) => {
                                const chatData: Chat = {
                                    ...chat,
                                    messages: convertToUIMessages(
                                        chat.messages as Array<CoreMessage>
                                    ),
                                };

                                return (
                                    <motion.div
                                        key={chatData.id}
                                        variants={staggerVariants.item}
                                        layout
                                        className="w-full"
                                    >
                                        <ChatDisplayCard chat={chatData} />
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
}
