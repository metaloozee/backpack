'use client';

import * as React from 'react';

import useWindowSize from '@/lib/hooks/use-window-size';

import { motion, AnimatePresence } from 'motion/react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import { Message } from 'ai';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    Check,
    ChevronDownIcon,
    CornerDownLeftIcon,
    SendHorizonalIcon,
    Zap,
    Brain,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from '@/components/ui/command';

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
}

const geminiModels = [
    {
        value: 'gemini-2.0-flash-lite-preview-02-05',
        label: 'Speed',
        description: 'gemini-2.0-flash-lite-preview-02-05',
        icon: Zap,
    },
    {
        value: 'gemini-2.0-flash',
        label: 'Quality',
        description: 'gemini-2.0-flash',
        icon: Brain,
    },
] as const;

type GeminiModel = (typeof geminiModels)[number]['value'];

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
}: InputPanelProps) {
    const [showEmptyScreen, setShowEmptyScreen] = React.useState(false);
    const router = useRouter();
    const inputRef = React.useRef<HTMLTextAreaElement>(null);
    const isFirstMessage = React.useRef(true);

    const [isComposing, setIsComposing] = React.useState(false);
    const [enterDisabled, setEnterDisabled] = React.useState(false);

    const [open, setOpen] = React.useState(false);
    const [selectedModel, setSelectedModel] = React.useState<GeminiModel>(
        'gemini-2.0-flash-lite-preview-02-05'
    );

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
                'mx-auto w-full',
                messages.length > 0
                    ? 'fixed bottom-0 left-0 right-0'
                    : 'flex flex-col items-center justify-center mb-20'
            )}
        >
            {messages.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="mb-6"
                >
                    <h1 className="text-3xl">Where Knowledge Begins</h1>
                </motion.div>
            )}
            <form
                onSubmit={handleSubmit}
                className={cn('max-w-3xl w-full mx-auto', messages.length > 0 && 'max-w-2xl')}
            >
                <div
                    className={cn(
                        'relative flex flex-col w-full gap-2 border-input bg-zinc-900/50 p-4 focus-within:border-zinc-700/70 hover:border-zinc-700/70 transition-all duration-200',
                        messages.length > 0
                            ? 'border-t-2 border-x-2 rounded-t-lg'
                            : 'border-2 rounded-lg'
                    )}
                >
                    <Textarea
                        ref={inputRef}
                        name="input"
                        rows={3}
                        tabIndex={0}
                        onCompositionStart={handlerCompositionStart}
                        onCompositionEnd={handleCompositionEnd}
                        placeholder="Ask me anything..."
                        spellCheck={true}
                        value={input}
                        className="resize-none w-full min-h-12 bg-transparent ring-0 border-0 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
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
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger disabled={messages.length !== 0} asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={open}
                                    className={cn(
                                        'w-[150px] justify-between truncate bg-zinc-800/50 transition-all duration-200'
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        {selectedModel && (
                                            <div className="flex items-center">
                                                {React.createElement(
                                                    geminiModels.find(
                                                        (model) => model.value === selectedModel
                                                    )?.icon || Brain,
                                                    {
                                                        className: cn(
                                                            'w-4 h-4',
                                                            selectedModel === 'gemini-2.0-flash'
                                                                ? 'text-blue-500'
                                                                : 'text-green-500'
                                                        ),
                                                    }
                                                )}
                                            </div>
                                        )}
                                        <span>
                                            {selectedModel
                                                ? geminiModels.find(
                                                      (model) => model.value === selectedModel
                                                  )?.label
                                                : 'Select model...'}
                                        </span>
                                    </div>
                                    <ChevronDownIcon className="opacity-50 h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-[300px] p-2 !font-sans bg-zinc-900/50 backdrop-blur-md rounded-lg shadow-lg border border-zinc-800"
                                align="start"
                                sideOffset={8}
                            >
                                <Command>
                                    <CommandList>
                                        <CommandGroup className="bg-zinc-900/50">
                                            {geminiModels.map((model) => (
                                                <CommandItem
                                                    key={model.value}
                                                    value={model.value}
                                                    onSelect={(currentValue) => {
                                                        setSelectedModel(
                                                            currentValue as GeminiModel
                                                        );
                                                        setOpen(false);
                                                    }}
                                                    className={cn(
                                                        'flex items-center gap-2 px-2 py-2.5 rounded-md text-sm cursor-pointer transition-colors duration-200'
                                                    )}
                                                >
                                                    <div className="p-1.5 rounded-md">
                                                        {React.createElement(model.icon, {
                                                            className: cn(
                                                                'w-4 h-4',
                                                                model.value === 'gemini-2.0-flash'
                                                                    ? 'text-blue-500'
                                                                    : 'text-green-500'
                                                            ),
                                                        })}
                                                    </div>
                                                    <div className="flex flex-col gap-px min-w-0">
                                                        <div className="font-medium">
                                                            {model.label}
                                                        </div>
                                                        <div className="text-xs">
                                                            {model.description}
                                                        </div>
                                                    </div>
                                                    <Check
                                                        className={cn(
                                                            'ml-auto h-4 w-4',
                                                            selectedModel === model.value
                                                                ? 'opacity-100'
                                                                : 'opacity-0'
                                                        )}
                                                    />
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        <AnimatePresence>
                            {input && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <Button type="submit" disabled={isLoading}>
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
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
                                            <SendHorizonalIcon />
                                        </motion.div>
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </form>
        </motion.div>
    );
}
