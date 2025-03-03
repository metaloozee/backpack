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
    BookIcon,
    FlaskConical,
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

// Replace with mode types
const modeTypes = [
    {
        value: 'default',
        label: 'Default',
        description: 'Standard mode with all features',
        icon: GlobeIcon,
        showWebSearch: true,
        showKnowledgeBase: true,
        showAcademicSearch: true,
        showXSearch: true,
        iconColor: 'text-sky-500',
        disabled: false,
    },
    {
        value: 'research',
        label: 'Research',
        description: 'Specialized for academic research (Coming Soon)',
        icon: FlaskConical,
        showWebSearch: false,
        showKnowledgeBase: false,
        showAcademicSearch: false,
        showXSearch: false,
        iconColor: 'text-amber-500',
        disabled: true,
    },
] as const;

type ModeType = (typeof modeTypes)[number]['value'];

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

    webSearch,
    setWebSearch,
    knowledgeBase,
    setKnowledgeBase,
    academicSearch,
    setAcademicSearch,
    xSearch,
    setXSearch,
}: InputPanelProps) {
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

    const updateXSearch = (value: boolean) => {
        if (typeof setXSearch === 'function') {
            setXSearch(value);
        }
    };

    const [showEmptyScreen, setShowEmptyScreen] = React.useState(false);
    const router = useRouter();
    const inputRef = React.useRef<HTMLTextAreaElement>(null);
    const isFirstMessage = React.useRef(true);

    const [isComposing, setIsComposing] = React.useState(false);
    const [enterDisabled, setEnterDisabled] = React.useState(false);

    const [open, setOpen] = React.useState(false);
    const [selectedMode, setSelectedMode] = React.useState<ModeType>('default');

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
                                                'justify-between truncate bg-zinc-800 transition-all duration-200 px-4 py-2'
                                            )}
                                        >
                                            <div className="flex items-center gap-2 text-xs">
                                                {selectedMode && (
                                                    <div className="flex items-center">
                                                        {React.createElement(
                                                            modeTypes.find(
                                                                (mode) =>
                                                                    mode.value === selectedMode
                                                            )?.icon || Brain,
                                                            {
                                                                className: `size-3 ${
                                                                    modeTypes.find(
                                                                        (mode) =>
                                                                            mode.value ===
                                                                            selectedMode
                                                                    )?.iconColor || 'text-primary'
                                                                }`,
                                                            }
                                                        )}
                                                    </div>
                                                )}
                                                <span className="text-xs font-normal">
                                                    {selectedMode
                                                        ? modeTypes.find(
                                                              (mode) => mode.value === selectedMode
                                                          )?.label
                                                        : 'Select mode...'}
                                                </span>
                                            </div>
                                            <ChevronDownIcon className="opacity-50 size-3" />
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
                                                    {modeTypes.map((mode) => (
                                                        <CommandItem
                                                            key={mode.value}
                                                            value={mode.value}
                                                            onSelect={(currentValue) => {
                                                                if (
                                                                    modeTypes.find(
                                                                        (m) =>
                                                                            m.value === currentValue
                                                                    )?.disabled
                                                                ) {
                                                                    return; // Don't select disabled modes
                                                                }

                                                                setSelectedMode(
                                                                    currentValue as ModeType
                                                                );
                                                                // Apply mode-specific settings
                                                                const selectedModeConfig =
                                                                    modeTypes.find(
                                                                        (m) =>
                                                                            m.value === currentValue
                                                                    );
                                                                if (selectedModeConfig) {
                                                                    updateWebSearch(
                                                                        selectedModeConfig.showWebSearch
                                                                    );
                                                                    updateKnowledgeBase(
                                                                        selectedModeConfig.showKnowledgeBase
                                                                    );
                                                                    updateAcademicSearch(
                                                                        selectedModeConfig.showAcademicSearch
                                                                    );
                                                                    updateXSearch(
                                                                        selectedModeConfig.showXSearch
                                                                    );
                                                                }
                                                                setOpen(false);
                                                            }}
                                                            className={cn(
                                                                'flex items-center gap-2 px-2 py-2.5 rounded-md text-sm cursor-pointer transition-colors duration-200',
                                                                mode.disabled &&
                                                                    'opacity-50 cursor-not-allowed'
                                                            )}
                                                        >
                                                            <div className="p-1.5 rounded-md">
                                                                {React.createElement(mode.icon, {
                                                                    className: `w-4 h-4 ${mode.iconColor}`,
                                                                })}
                                                            </div>
                                                            <div className="flex flex-col gap-px min-w-0">
                                                                <div className="font-medium">
                                                                    {mode.label}
                                                                </div>
                                                                <div className="text-xs">
                                                                    {mode.description}
                                                                </div>
                                                            </div>
                                                            <Check
                                                                className={cn(
                                                                    'ml-auto h-4 w-4',
                                                                    selectedMode === mode.value
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
                                    key={`cards-container-${selectedMode}`}
                                >
                                    {modeTypes.find((m) => m.value === selectedMode && !m.disabled)
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
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div
                                                            onClick={() =>
                                                                updateWebSearch(!webSearch)
                                                            }
                                                            className={cn(
                                                                'cursor-pointer text-muted-foreground px-4 py-2 rounded-md border-2 flex justity-center items-center gap-2 text-xs transition-all duration-200',
                                                                webSearch
                                                                    ? 'bg-zinc-800 border-zinc-800 text-primary'
                                                                    : 'bg-zinc-900 border-zinc-800'
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
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div
                                                            onClick={() =>
                                                                updateKnowledgeBase(!knowledgeBase)
                                                            }
                                                            className={cn(
                                                                'cursor-pointer text-muted-foreground px-4 py-2 rounded-md border-2 flex justity-center items-center gap-2 text-xs transition-all duration-200',
                                                                knowledgeBase
                                                                    ? 'bg-zinc-800 border-zinc-800 text-primary'
                                                                    : 'bg-zinc-900 border-zinc-800'
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
                                                                'cursor-pointer text-muted-foreground px-4 py-2 rounded-md border-2 flex justity-center items-center gap-2 text-xs transition-all duration-200',
                                                                academicSearch
                                                                    ? 'bg-zinc-800 border-zinc-800 text-primary'
                                                                    : 'bg-zinc-900 border-zinc-800'
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
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div
                                                            onClick={() => updateXSearch(!xSearch)}
                                                            className={cn(
                                                                'cursor-pointer text-muted-foreground px-4 py-2 rounded-md border-2 flex justity-center items-center gap-2 text-xs transition-all duration-200',
                                                                xSearch
                                                                    ? 'bg-zinc-800 border-zinc-800 text-primary'
                                                                    : 'bg-zinc-900 border-zinc-800'
                                                            )}
                                                        >
                                                            <TwitterLogoIcon className="size-3.5" />
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>X (Twitter) Search</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
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
