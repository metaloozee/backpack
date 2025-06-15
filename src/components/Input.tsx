'use client';

import * as React from 'react';

import { motion, AnimatePresence } from 'motion/react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { CoreMessage, Message, Attachment, UIMessage } from 'ai';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    CornerDownLeftIcon,
    StopCircleIcon,
    GlobeIcon,
    BookCopyIcon,
    GraduationCapIcon,
    FlaskConical,
} from 'lucide-react';
import { usePathname } from 'next/navigation';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { useLocalStorage, useWindowSize } from 'usehooks-ts';
import {
    layoutTransition,
    staggerVariants,
    fadeVariants,
    slideVariants,
    transitions,
} from '@/lib/animations';
import { UseChatHelpers } from '@ai-sdk/react';
import { Dispatch, SetStateAction } from 'react';

interface InputPanelProps {
    chatId: string;
    input: UseChatHelpers['input'];
    setInput: UseChatHelpers['setInput'];
    handleSubmit: UseChatHelpers['handleSubmit'];
    status: UseChatHelpers['status'];
    stop: () => void;
    attachments: Array<Attachment>;
    setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
    messages: Array<UIMessage>;
    setMessages: UseChatHelpers['setMessages'];
    append: UseChatHelpers['append'];
    webSearch: boolean;
    setWebSearch: (webSearch: boolean) => void;
    knowledgeSearch: boolean;
    setKnowledgeSearch: (knowledgeSearch: boolean) => void;
    academicSearch: boolean;
    setAcademicSearch: (academicSearch: boolean) => void;
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
    handleSubmit,
    status,
    stop,
    attachments,
    setAttachments,
    messages,
    setMessages,
    append,
    webSearch,
    setWebSearch,
    knowledgeSearch,
    setKnowledgeSearch,
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

    const isLoading = status === 'submitted' || status === 'streaming';

    const [localStorageInput, setLocalStorageInput] = useLocalStorage('input', '');
    const [isComposing, setIsComposing] = React.useState(false);
    const [enterDisabled, setEnterDisabled] = React.useState(false);
    const [selectedMode, setSelectedMode] = React.useState<ModeType>('ask');
    const [showEmptyScreen, setShowEmptyScreen] = React.useState(false);
    const [selectedAgent, setSelectedAgent] = React.useState<string | null>(null);

    const pathname = usePathname();
    const isSpaceChat = pathname.startsWith('/s/');
    const router = useRouter();

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

    React.useEffect(() => {
        setLocalStorageInput(input);
    }, [input, setLocalStorageInput]);

    const handleInput = React.useCallback(
        (event: React.ChangeEvent<HTMLTextAreaElement>) => {
            setInput(event.target.value);
            adjustHeight();
        },
        [setInput, adjustHeight]
    );

    const updateWebSearch = React.useCallback(
        (value: boolean) => {
            if (typeof setWebSearch === 'function') {
                setWebSearch(value);
            }
        },
        [setWebSearch]
    );

    const updateKnowledgeSearch = React.useCallback(
        (value: boolean) => {
            if (typeof setKnowledgeSearch === 'function') {
                setKnowledgeSearch(value);
            }
        },
        [setKnowledgeSearch]
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
        if (selectedMode === 'ask') {
            if (isSpaceChat) {
                updateWebSearch(true);
                updateKnowledgeSearch(true);
                updateAcademicSearch(false);
            } else {
                updateWebSearch(true);
                updateKnowledgeSearch(false);
                updateAcademicSearch(false);
            }
        }
    }, [isSpaceChat, selectedMode, updateWebSearch, updateKnowledgeSearch, updateAcademicSearch]);

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
                if ('tools' in selectedModeConfig && selectedModeConfig.tools) {
                    if (isSpaceChat) {
                        updateWebSearch(true);
                        updateKnowledgeSearch(true);
                        updateAcademicSearch(false);
                    } else {
                        updateWebSearch(true);
                        updateKnowledgeSearch(false);
                        updateAcademicSearch(false);
                    }
                    setSelectedAgent(null);
                } else if ('agents' in selectedModeConfig && selectedModeConfig.agents) {
                    updateWebSearch(false);
                    updateKnowledgeSearch(false);
                    updateAcademicSearch(false);
                    const defaultAgent = Object.keys(selectedModeConfig.agents)[0];
                    setSelectedAgent(defaultAgent || null);
                }
            }
        },
        [updateWebSearch, updateKnowledgeSearch, updateAcademicSearch]
    );

    const submitForm = React.useCallback(
        (event?: React.FormEvent) => {
            if (event) {
                event.preventDefault();
            }

            if (!input.trim()) return;

            handleSubmit(event);

            resetHeight();

            if (width && width > 768) {
                textareaRef.current?.focus();
            }
        },
        [input, handleSubmit, resetHeight, width]
    );

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
                'w-full bg-background',
                messages.length > 0
                    ? 'bottom-0 left-0 right-0'
                    : isSpaceChat
                      ? 'mt-20'
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
            <div className={cn('max-w-3xl w-full mx-auto')}>
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
                                    {(() => {
                                        const mode = modeTypes.find(
                                            (m) => m.value === selectedMode && !m.disabled
                                        );
                                        return mode && 'tools' in mode && mode.tools?.webSearch;
                                    })() && (
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
                                    {(() => {
                                        const mode = modeTypes.find(
                                            (m) => m.value === selectedMode && !m.disabled
                                        );
                                        return (
                                            mode && 'tools' in mode && mode.tools?.knowledgeSearch
                                        );
                                    })() && (
                                        <motion.div
                                            variants={staggerVariants.item}
                                            key="knowledge-search-card"
                                            layout
                                            layoutId="knowledge-search-section"
                                        >
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div
                                                            onClick={() =>
                                                                updateKnowledgeSearch(
                                                                    !knowledgeSearch
                                                                )
                                                            }
                                                            className={cn(
                                                                'cursor-pointer text-muted-foreground px-4 py-2 rounded-md border-2 flex justify-center items-center gap-2 text-xs transition-all duration-200',
                                                                knowledgeSearch
                                                                    ? 'bg-neutral-800 border-neutral-800 text-primary'
                                                                    : 'bg-neutral-900 border-neutral-800'
                                                            )}
                                                        >
                                                            <BookCopyIcon className="size-3.5" />
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Knowledge Search</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </motion.div>
                                    )}
                                    {(() => {
                                        const mode = modeTypes.find(
                                            (m) => m.value === selectedMode && !m.disabled
                                        );
                                        return (
                                            mode && 'tools' in mode && mode.tools?.academicSearch
                                        );
                                    })() && (
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

                                    {(() => {
                                        const mode = modeTypes.find(
                                            (m) => m.value === selectedMode && !m.disabled
                                        );
                                        if (mode && 'agents' in mode && mode.agents) {
                                            return Object.entries(mode.agents).map(
                                                ([agentKey, enabled]) => {
                                                    if (!enabled) return null;

                                                    return (
                                                        <motion.div
                                                            variants={staggerVariants.item}
                                                            key={`${agentKey}-agent-card`}
                                                            layout
                                                            layoutId={`${agentKey}-agent-section`}
                                                        >
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <div
                                                                            onClick={() =>
                                                                                setSelectedAgent(
                                                                                    selectedAgent ===
                                                                                        agentKey
                                                                                        ? null
                                                                                        : agentKey
                                                                                )
                                                                            }
                                                                            className={cn(
                                                                                'cursor-pointer text-muted-foreground px-4 py-2 rounded-md border-2 flex justify-center items-center gap-2 text-xs transition-all duration-200',
                                                                                selectedAgent ===
                                                                                    agentKey
                                                                                    ? 'bg-neutral-800 border-neutral-800 text-primary'
                                                                                    : 'bg-neutral-900 border-neutral-800'
                                                                            )}
                                                                        >
                                                                            {agentKey ===
                                                                                'research' && (
                                                                                <FlaskConical className="size-3.5" />
                                                                            )}
                                                                        </div>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>
                                                                            {agentKey
                                                                                .charAt(0)
                                                                                .toUpperCase() +
                                                                                agentKey.slice(
                                                                                    1
                                                                                )}{' '}
                                                                            Agent
                                                                        </p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        </motion.div>
                                                    );
                                                }
                                            );
                                        }
                                        return null;
                                    })()}
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
    if (prevProps.status !== nextProps.status) return false;
    if (prevProps.messages.length !== nextProps.messages.length) return false;
    if (prevProps.input !== nextProps.input) return false;
    if (prevProps.webSearch !== nextProps.webSearch) return false;
    if (prevProps.knowledgeSearch !== nextProps.knowledgeSearch) return false;
    if (prevProps.academicSearch !== nextProps.academicSearch) return false;

    return true;
});

Input.displayName = 'Input';
