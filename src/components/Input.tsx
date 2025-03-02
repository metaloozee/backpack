'use client';

import * as React from 'react';

import { motion, AnimatePresence } from 'motion/react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import { CoreMessage, Message } from 'ai';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    Check,
    ChevronDownIcon,
    CornerDownLeftIcon,
    Zap,
    Brain,
    StopCircleIcon,
    BookOpenTextIcon,
    GlobeIcon,
    BookCopyIcon,
    GraduationCap,
    Users,
    GraduationCapIcon,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandList, CommandGroup, CommandItem } from '@/components/ui/command';
import { usePathname } from 'next/navigation';
import { ChatData } from '@/app/(main)/(spaces)/s/[id]/page';
import { Separator } from './ui/separator';
import { Chat } from '@/lib/db/schema/app';
import { convertToUIMessages } from '@/lib/ai/convertToUIMessages';
import ChatDisplayCard from './chat/DisplayCard';
import { TwitterLogoIcon } from '@radix-ui/react-icons';

interface InputPanelProps {
    input: string;
    handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
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

    xSearch: boolean;
    setXSearch: (xSearch: boolean) => void;

    chatsData?: Array<ChatData>;
}

const agentTypes = [
    {
        value: 'default',
        label: 'Default',
        description: 'General purpose search assistant',
        icon: GlobeIcon,
        showWebSearch: true,
        showKnowledgeBase: false,
        showAcademicSearch: false,
        showXSearch: false,
        iconColor: 'text-sky-500',
    },
    {
        value: 'academic',
        label: 'Academic',
        description: 'Specialized for academic research',
        icon: GraduationCap,
        showWebSearch: true,
        showKnowledgeBase: true,
        showAcademicSearch: true,
        showXSearch: false,
        iconColor: 'text-green-500',
    },
    {
        value: 'social',
        label: 'Social',
        description: 'Optimized for social interactions',
        icon: Users,
        showWebSearch: false,
        showKnowledgeBase: false,
        showAcademicSearch: false,
        showXSearch: true,
        iconColor: 'text-indigo-500',
    },
] as const;

type AgentType = (typeof agentTypes)[number]['value'];

export function Input({
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    messages,
    setMessages,
    query,
    stop,
    append,
    chatsData,

    webSearch: externalWebSearch,
    setWebSearch,
    knowledgeBase: externalKnowledgeBase,
    setKnowledgeBase,
    academicSearch: externalAcademicSearch,
    setAcademicSearch,
    xSearch: externalXSearch,
    setXSearch,
}: InputPanelProps) {
    const pathname = usePathname();
    const isSpaceChat = pathname.startsWith('/s/');

    // Internal state management for when external state setters aren't provided
    const [internalWebSearch, setInternalWebSearch] = React.useState(!!externalWebSearch);
    const [internalKnowledgeBase, setInternalKnowledgeBase] =
        React.useState(!!externalKnowledgeBase);
    const [internalAcademicSearch, setInternalAcademicSearch] =
        React.useState(!!externalAcademicSearch);
    const [internalXSearch, setInternalXSearch] = React.useState(!!externalXSearch);

    // Use external state if provided, otherwise use internal state
    const webSearch =
        typeof externalWebSearch !== 'undefined' ? externalWebSearch : internalWebSearch;
    const knowledgeBase =
        typeof externalKnowledgeBase !== 'undefined'
            ? externalKnowledgeBase
            : internalKnowledgeBase;
    const academicSearch =
        typeof externalAcademicSearch !== 'undefined'
            ? externalAcademicSearch
            : internalAcademicSearch;
    const xSearch = typeof externalXSearch !== 'undefined' ? externalXSearch : internalXSearch;

    // Functions to update state - use external if provided, otherwise use internal
    const updateWebSearch = (value: boolean) => {
        if (typeof setWebSearch === 'function') {
            setWebSearch(value);
        } else {
            setInternalWebSearch(value);
        }
    };

    const updateKnowledgeBase = (value: boolean) => {
        if (typeof setKnowledgeBase === 'function') {
            setKnowledgeBase(value);
        } else {
            setInternalKnowledgeBase(value);
        }
    };

    const updateAcademicSearch = (value: boolean) => {
        if (typeof setAcademicSearch === 'function') {
            setAcademicSearch(value);
        } else {
            setInternalAcademicSearch(value);
        }
    };

    const updateXSearch = (value: boolean) => {
        if (typeof setXSearch === 'function') {
            setXSearch(value);
        } else {
            setInternalXSearch(value);
        }
    };

    const [showEmptyScreen, setShowEmptyScreen] = React.useState(false);
    const router = useRouter();
    const inputRef = React.useRef<HTMLTextAreaElement>(null);
    const isFirstMessage = React.useRef(true);

    const [isComposing, setIsComposing] = React.useState(false);
    const [enterDisabled, setEnterDisabled] = React.useState(false);

    const [open, setOpen] = React.useState(false);
    const [selectedAgent, setSelectedAgent] = React.useState<AgentType>('default');

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

    React.useEffect(() => {
        if (isFirstMessage.current && query && query.trim().length > 0) {
            append({
                role: 'user',
                content: query,
            });
            isFirstMessage.current = false;
        }
    }, [query]);

    return (
        <motion.div
            layout
            transition={{
                duration: 0.3,
                ease: [0.32, 0.72, 0, 1],
                layout: {
                    duration: 0.3,
                },
            }}
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
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: 0.1 }}
                    className="mb-6"
                >
                    <h1 className="text-3xl text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-500">
                        Your Research, Simplified.
                    </h1>
                </motion.div>
            )}
            <form
                onSubmit={handleSubmit}
                className={cn(isSpaceChat ? 'max-w-2xl w-full' : 'max-w-3xl w-full mx-auto')}
            >
                <div
                    className={cn(
                        'relative flex flex-col w-full p-4 gap-4 border-input bg-zinc-900/50 focus-within:border-zinc-700/70 hover:border-zinc-700/70 transition-all duration-200',
                        messages.length > 0
                            ? 'border-t-2 border-x-2 rounded-t-lg'
                            : 'border-2 rounded-lg'
                    )}
                >
                    <Textarea
                        autoFocus
                        ref={inputRef}
                        name="input"
                        rows={2}
                        tabIndex={0}
                        onCompositionStart={handlerCompositionStart}
                        onCompositionEnd={handleCompositionEnd}
                        placeholder="Ask me anything..."
                        spellCheck={true}
                        value={input}
                        className="resize-none w-full bg-transparent ring-0 border-0 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
                        onChange={(e) => {
                            handleInputChange(e);
                            setShowEmptyScreen(e.target.value.length === 0);
                        }}
                        onKeyDown={(e) => {
                            if (
                                e.key === 'Enter' &&
                                !e.shiftKey &&
                                !isComposing &&
                                !enterDisabled
                            ) {
                                if (input.trim().length === 0) {
                                    e.preventDefault();
                                    return;
                                }

                                e.preventDefault();
                                const textarea = e.target as HTMLTextAreaElement;
                                textarea.form?.requestSubmit();
                            }
                        }}
                        onFocus={() => setShowEmptyScreen(true)}
                        onBlur={() => setShowEmptyScreen(false)}
                    />

                    <div className="w-full flex justify-between items-center">
                        <div className="flex flex-row justify-start items-center gap-2">
                            <Popover open={open} onOpenChange={setOpen}>
                                <PopoverTrigger disabled={messages.length !== 0} asChild>
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            duration: 0.3,
                                            ease: 'easeInOut',
                                        }}
                                    >
                                        <Button
                                            size={null}
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={open}
                                            className={cn(
                                                'justify-between truncate bg-zinc-800 transition-all duration-200 px-4 py-2 border-2'
                                            )}
                                        >
                                            <div className="flex items-center gap-2 text-xs">
                                                {selectedAgent && (
                                                    <div className="flex items-center">
                                                        {React.createElement(
                                                            agentTypes.find(
                                                                (agent) =>
                                                                    agent.value === selectedAgent
                                                            )?.icon || Brain,
                                                            {
                                                                className: `w-4 h-4 ${
                                                                    agentTypes.find(
                                                                        (agent) =>
                                                                            agent.value ===
                                                                            selectedAgent
                                                                    )?.iconColor || 'text-primary'
                                                                }`,
                                                            }
                                                        )}
                                                    </div>
                                                )}
                                                <span>
                                                    {selectedAgent
                                                        ? agentTypes.find(
                                                              (agent) =>
                                                                  agent.value === selectedAgent
                                                          )?.label
                                                        : 'Select agent...'}
                                                </span>
                                            </div>
                                            <ChevronDownIcon className="opacity-50 h-4 w-4" />
                                        </Button>
                                    </motion.div>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-[300px] p-2 !font-sans bg-zinc-900/50 backdrop-blur-md rounded-lg shadow-lg border border-zinc-800"
                                    align="start"
                                    sideOffset={8}
                                    forceMount
                                >
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{
                                            duration: 0.2,
                                            ease: 'easeInOut',
                                        }}
                                    >
                                        <Command>
                                            <CommandList>
                                                <CommandGroup className="bg-zinc-900/50">
                                                    {agentTypes.map((agent) => (
                                                        <CommandItem
                                                            key={agent.value}
                                                            value={agent.value}
                                                            onSelect={(currentValue) => {
                                                                setSelectedAgent(
                                                                    currentValue as AgentType
                                                                );
                                                                // Apply agent-specific settings
                                                                const selectedAgentConfig =
                                                                    agentTypes.find(
                                                                        (a) =>
                                                                            a.value === currentValue
                                                                    );
                                                                if (selectedAgentConfig) {
                                                                    updateWebSearch(
                                                                        selectedAgentConfig.showWebSearch
                                                                    );
                                                                    updateKnowledgeBase(
                                                                        selectedAgentConfig.showKnowledgeBase
                                                                    );
                                                                    updateAcademicSearch(
                                                                        selectedAgentConfig.showAcademicSearch
                                                                    );
                                                                    updateXSearch(
                                                                        selectedAgentConfig.showXSearch
                                                                    );
                                                                }
                                                                setOpen(false);
                                                            }}
                                                            className={cn(
                                                                'flex items-center gap-2 px-2 py-2.5 rounded-md text-sm cursor-pointer transition-colors duration-200'
                                                            )}
                                                        >
                                                            <div className="p-1.5 rounded-md">
                                                                {React.createElement(agent.icon, {
                                                                    className: `w-4 h-4 ${agent.iconColor}`,
                                                                })}
                                                            </div>
                                                            <div className="flex flex-col gap-px min-w-0">
                                                                <div className="font-medium">
                                                                    {agent.label}
                                                                </div>
                                                                <div className="text-xs">
                                                                    {agent.description}
                                                                </div>
                                                            </div>
                                                            <Check
                                                                className={cn(
                                                                    'ml-auto h-4 w-4',
                                                                    selectedAgent === agent.value
                                                                        ? 'opacity-100'
                                                                        : 'opacity-0'
                                                                )}
                                                            />
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </motion.div>
                                </PopoverContent>
                            </Popover>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    className="flex flex-row gap-2"
                                    variants={{
                                        hidden: {},
                                        show: {
                                            transition: {
                                                staggerChildren: 0.1,
                                            },
                                        },
                                        exit: {
                                            transition: {
                                                staggerChildren: 0.05,
                                                staggerDirection: -1,
                                            },
                                        },
                                    }}
                                    initial="hidden"
                                    animate="show"
                                    exit="exit"
                                    key={`cards-container-${selectedAgent}`}
                                >
                                    {agentTypes.find((a) => a.value === selectedAgent)
                                        ?.showWebSearch && (
                                        <motion.div
                                            variants={{
                                                hidden: { opacity: 0, y: 5 },
                                                show: { opacity: 1, y: 0 },
                                                exit: { opacity: 0, y: -5 },
                                            }}
                                            transition={{
                                                duration: 0.3,
                                                ease: 'easeInOut',
                                            }}
                                            key="web-search-card"
                                            layout
                                        >
                                            <div
                                                onClick={() => updateWebSearch(!webSearch)}
                                                className={cn(
                                                    'cursor-pointer text-muted-foreground px-4 py-2 rounded-md border-2 flex justity-center items-center gap-2 text-xs transition-all duration-200',
                                                    webSearch
                                                        ? 'bg-zinc-800 border-zinc-800 text-primary'
                                                        : 'bg-zinc-900 border-zinc-800'
                                                )}
                                            >
                                                <GlobeIcon className="size-3" /> Web Search
                                            </div>
                                        </motion.div>
                                    )}
                                    {agentTypes.find((a) => a.value === selectedAgent)
                                        ?.showKnowledgeBase && (
                                        <motion.div
                                            variants={{
                                                hidden: { opacity: 0, y: 5 },
                                                show: { opacity: 1, y: 0 },
                                                exit: { opacity: 0, y: -5 },
                                            }}
                                            transition={{
                                                duration: 0.3,
                                                ease: 'easeInOut',
                                            }}
                                            key="knowledge-base-card"
                                            layout
                                        >
                                            <div
                                                onClick={() => updateKnowledgeBase(!knowledgeBase)}
                                                className={cn(
                                                    'cursor-pointer text-muted-foreground px-4 py-2 rounded-md border-2 flex justity-center items-center gap-2 text-xs transition-all duration-200',
                                                    knowledgeBase
                                                        ? 'bg-zinc-800 border-zinc-800 text-primary'
                                                        : 'bg-zinc-900 border-zinc-800'
                                                )}
                                            >
                                                <BookCopyIcon className="size-3" /> Knowledge Base
                                            </div>
                                        </motion.div>
                                    )}
                                    {agentTypes.find((a) => a.value === selectedAgent)
                                        ?.showAcademicSearch && (
                                        <motion.div
                                            variants={{
                                                hidden: { opacity: 0, y: 5 },
                                                show: { opacity: 1, y: 0 },
                                                exit: { opacity: 0, y: -5 },
                                            }}
                                            transition={{
                                                duration: 0.3,
                                                ease: 'easeInOut',
                                            }}
                                            key="academic-search-card"
                                            layout
                                        >
                                            <div
                                                onClick={() =>
                                                    updateAcademicSearch(!academicSearch)
                                                }
                                                className={cn(
                                                    'cursor-pointer text-muted-foreground px-4 py-2 rounded-md border-2 flex justity-center items-center gap-2 text-xs transition-all duration-200',
                                                    academicSearch
                                                        ? 'bg-zinc-800 border-zinc-800 text-primary'
                                                        : 'bg-zinc-900 border-zinc-800'
                                                )}
                                            >
                                                <GraduationCapIcon className="size-3" /> Academic
                                                Search
                                            </div>
                                        </motion.div>
                                    )}
                                    {agentTypes.find((a) => a.value === selectedAgent)
                                        ?.showXSearch && (
                                        <motion.div
                                            variants={{
                                                hidden: { opacity: 0, y: 5 },
                                                show: { opacity: 1, y: 0 },
                                                exit: { opacity: 0, y: -5 },
                                            }}
                                            transition={{
                                                duration: 0.3,
                                                ease: 'easeInOut',
                                            }}
                                            key="x-search-card"
                                            layout
                                        >
                                            <div
                                                onClick={() => updateXSearch(!xSearch)}
                                                className={cn(
                                                    'cursor-pointer text-muted-foreground px-4 py-2 rounded-md border-2 flex justity-center items-center gap-2 text-xs transition-all duration-200',
                                                    xSearch
                                                        ? 'bg-zinc-800 border-zinc-800 text-primary'
                                                        : 'bg-zinc-900 border-zinc-800'
                                                )}
                                            >
                                                <TwitterLogoIcon className="size-3" /> X (Twitter)
                                                Search
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: 0.1 }}
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
                                            initial={{ opacity: 0, y: -20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 20 }}
                                            transition={{
                                                delay: 0.2,
                                                type: 'spring',
                                                stiffness: 400,
                                                damping: 10,
                                            }}
                                        >
                                            <StopCircleIcon />
                                        </motion.div>
                                    </Button>
                                ) : (
                                    <Button
                                        className="px-4"
                                        size={'sm'}
                                        type="submit"
                                        disabled={isLoading}
                                        variant={input ? 'default' : 'secondary'}
                                    >
                                        <motion.div
                                            initial={{ opacity: 0, y: -20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{
                                                x: 20,
                                            }}
                                            transition={{
                                                delay: 0.2,
                                                type: 'spring',
                                                stiffness: 400,
                                                damping: 10,
                                            }}
                                        >
                                            <CornerDownLeftIcon
                                                className={cn(
                                                    input
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
                        variants={{
                            hidden: { opacity: 1 },
                            visible: {
                                opacity: 1,
                                transition: {
                                    delayChildren: 0.1,
                                    staggerChildren: 0.1,
                                },
                            },
                        }}
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
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{
                                            delay: 0.1,
                                        }}
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
