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
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { ChatData } from '@/app/(main)/(spaces)/s/[id]/page';
import { Separator } from './ui/separator';
import { Chat } from '@/lib/db/schema/app';
import { convertToUIMessages } from '@/lib/ai/convertToUIMessages';
import ChatDisplayCard from './chat/DisplayCard';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { useLocalStorage, useWindowSize } from 'usehooks-ts';
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
        disabled: false,
    },
    {
        value: 'research',
        label: 'Research',
        description: 'Specialized for academic research',
        showWebSearch: true,
        showKnowledgeBase: true,
        showAcademicSearch: true,
        disabled: true,
    },
] as const;

type ModeType = (typeof modeTypes)[number]['value'];

function PureInput({
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

    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const { width } = useWindowSize();

    const [input, setInput] = React.useState('');
    const [localStorageInput, setLocalStorageInput] = useLocalStorage('input', '');
    const [isComposing, setIsComposing] = React.useState(false);
    const [enterDisabled, setEnterDisabled] = React.useState(false);
    const [selectedMode, setSelectedMode] = React.useState<ModeType>('ask');
    const [showEmptyScreen, setShowEmptyScreen] = React.useState(false);

    const pathname = usePathname();
    const isSpaceChat = pathname.startsWith('/s/');
    const router = useRouter();

    const processedInitialQuery = React.useRef(false);

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
            const domValue = textareaRef.current.value;
            const finalValue = domValue || localStorageInput || '';
            setInput(finalValue);
            adjustHeight();
        }
    }, []);

    React.useEffect(() => {
        setLocalStorageInput(input);
    }, [input, setLocalStorageInput]);

    const handleInput = React.useCallback(
        (event: React.ChangeEvent<HTMLTextAreaElement>) => {
            setInput(event.target.value);
            adjustHeight();
        },
        [adjustHeight]
    );

    const updateWebSearch = React.useCallback(
        (value: boolean) => {
            if (typeof setWebSearch === 'function') {
                setWebSearch(value);
            }
        },
        [setWebSearch]
    );

    const updateKnowledgeBase = React.useCallback(
        (value: boolean) => {
            if (typeof setKnowledgeBase === 'function') {
                setKnowledgeBase(value);
            }
        },
        [setKnowledgeBase]
    );

    const updateAcademicSearch = React.useCallback(
        (value: boolean) => {
            if (typeof setAcademicSearch === 'function') {
                setAcademicSearch(value);
            }
        },
        [setAcademicSearch]
    );

    React.useEffect(() => {
        if (query && query.trim().length > 0 && !processedInitialQuery.current) {
            append({
                role: 'user',
                content: query,
            });
            processedInitialQuery.current = true;
        }
    }, [query, append]);

    const handlerCompositionStart = React.useCallback(() => setIsComposing(true), []);

    const handleCompositionEnd = React.useCallback(() => {
        setIsComposing(false);
        setEnterDisabled(true);

        setTimeout(() => {
            setEnterDisabled(false);
        }, 300);
    }, []);

    const handleModeChange = React.useCallback(
        (value: string) => {
            const newMode = value as ModeType;
            setSelectedMode(newMode);
            console.log('Mode switched to:', newMode);

            const selectedModeConfig = modeTypes.find((m) => m.value === newMode);
            if (selectedModeConfig) {
                updateWebSearch(selectedModeConfig.showWebSearch);
                updateKnowledgeBase(selectedModeConfig.showKnowledgeBase);
                updateAcademicSearch(selectedModeConfig.showAcademicSearch);
            }
        },
        [updateWebSearch, updateKnowledgeBase, updateAcademicSearch]
    );

    const submitForm = React.useCallback(() => {
        if (!input.trim()) return;

        append({
            role: 'user',
            content: input.trim(),
        });

        setInput('');
        setLocalStorageInput('');
        resetHeight();

        if (width && width > 768) {
            textareaRef.current?.focus();
        }
    }, [input, append, setLocalStorageInput, resetHeight, width]);

    const handleKeyDown = React.useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (
                e.key === 'Enter' &&
                !e.shiftKey &&
                !isComposing &&
                !enterDisabled &&
                !e.nativeEvent.isComposing
            ) {
                e.preventDefault();

                if (!input.trim()) return;

                submitForm();
            }
        },
        [isComposing, enterDisabled, input, submitForm]
    );

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
                        {greeting}
                    </h1>
                </motion.div>
            )}
            <div className={cn(isSpaceChat ? 'max-w-2xl w-full' : 'max-w-3xl w-full mx-auto')}>
                <div
                    className={cn(
                        'relative flex flex-col w-full p-4 gap-4 border-input bg-neutral-900/50 focus-within:border-neutral-700/70 hover:border-neutral-700/70 transition-all duration-200',
                        messages.length > 0
                            ? 'border-t-2 border-x-2 rounded-t-lg'
                            : 'border-2 rounded-lg'
                    )}
                >
                    <Textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                        onCompositionStart={handlerCompositionStart}
                        onCompositionEnd={handleCompositionEnd}
                        onFocus={() => setShowEmptyScreen(true)}
                        onBlur={() => setShowEmptyScreen(false)}
                        placeholder="Ask me anything..."
                        autoFocus
                        tabIndex={0}
                        spellCheck={true}
                        className="resize-none w-full bg-transparent ring-0 border-0 text-sm placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
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
                                    <TabsList className="grid w-full grid-cols-2 bg-neutral-950">
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
                                    <StopButton stop={stop} setMessages={setMessages} />
                                ) : (
                                    <SendButton input={input} submitForm={submitForm} />
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </div>
                </div>
            </div>

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
                                // Fix the type issue by only using valid Chat properties
                                const chatData: Chat = {
                                    id: chat.id,
                                    title: chat.chatName,
                                    spaceId: chat.spaceId,
                                    createdAt: chat.createdAt,
                                    userId: chat.userId,
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

const StopButton = React.memo(
    ({ stop, setMessages }: { stop: () => void; setMessages: (messages: any) => void }) => (
        <Button
            size={'sm'}
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

const SendButton = React.memo(
    ({ input, submitForm }: { input: string; submitForm: () => void }) => (
        <Button
            className="px-4"
            size={'sm'}
            onClick={(event) => {
                event.preventDefault();
                submitForm();
            }}
            disabled={input.length === 0}
            variant={input.trim().length > 0 ? 'default' : 'secondary'}
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
                        input.trim().length > 0 ? 'text-background' : 'text-muted-foreground'
                    )}
                />
            </motion.div>
        </Button>
    )
);

StopButton.displayName = 'StopButton';
SendButton.displayName = 'SendButton';

export const Input = React.memo(PureInput, (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.messages.length !== nextProps.messages.length) return false;
    if (prevProps.query !== nextProps.query) return false;
    if (prevProps.webSearch !== nextProps.webSearch) return false;
    if (prevProps.knowledgeBase !== nextProps.knowledgeBase) return false;
    if (prevProps.academicSearch !== nextProps.academicSearch) return false;
    if (prevProps.chatsData?.length !== nextProps.chatsData?.length) return false;

    return true;
});

Input.displayName = 'Input';
