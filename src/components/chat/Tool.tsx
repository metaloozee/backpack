'use client';

import { motion, AnimatePresence } from 'motion/react';
import { CircleCheckBigIcon, Globe2Icon, Loader2Icon } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TextShimmer } from '../ui/text-shimmer';
import Link from 'next/link';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';

interface ToolProps {
    tool: {
        type: 'tool-call';
        data: {
            toolCallId: string;
            toolName: string;
            state: 'call' | 'result';
            args: string;
            result?: string;
        };
    };
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
}

const toolAnimation = {
    initial: { y: 5, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { opacity: 0 },
    transition: {
        duration: 0.3,
        ease: [0.32, 0.72, 0, 1],
    },
};

const ToolComponents: Record<string, React.FC<ToolProps>> = {
    web_search: ({ tool }) => (
        <motion.div {...toolAnimation} className="flex gap-1 items-center">
            {tool.data.state === 'result' ? (
                <HoverCard openDelay={0}>
                    <HoverCardTrigger asChild>
                        <div className="my-4 px-4 py-2 rounded-full bg-zinc-800/50 text-xs flex justify-start items-center gap-2">
                            <Globe2Icon className="size-3" />
                            {tool.data.result &&
                                JSON.parse(tool.data.result!).processedResults.length}{' '}
                            Web Pages
                        </div>
                    </HoverCardTrigger>
                    <HoverCardContent side="top" sideOffset={10} className="max-w-2xl w-full">
                        <ScrollArea className="h-[30vh] text-xs break-words w-full">
                            <div className="mb-4 flex flex-row flex-wrap gap-2 w-full">
                                {JSON.parse(tool.data.args).queries.map(
                                    (query: string, index: number) => (
                                        <div
                                            key={index}
                                            className="rounded-full px-4 py-2 bg-zinc-800/50 text-xs shrink-0 flex justify-start items-center gap-2"
                                        >
                                            <MagnifyingGlassIcon className="size-3 flex-1" />
                                            {query}
                                        </div>
                                    )
                                )}
                            </div>
                            {tool.data.result &&
                                JSON.parse(tool.data.result!).processedResults.map(
                                    (item: any, index: number) => (
                                        <div
                                            key={index}
                                            className="bg-zinc-900 rounded-md p-2 mb-2"
                                        >
                                            <Link
                                                href={item.url}
                                                target="_blank"
                                                className="text-sm text-muted-foreground underline truncate max-w-fit"
                                            >
                                                {item.title}
                                            </Link>
                                            <p className="text-xs break-words text-justify">
                                                {item.content.slice(0, 100)}...
                                            </p>
                                        </div>
                                    )
                                )}
                        </ScrollArea>
                    </HoverCardContent>
                </HoverCard>
            ) : (
                <TextShimmer className="text-sm mb-4">searching the web...</TextShimmer>
            )}
        </motion.div>
    ),
    search_knowledge: ({ tool }) => (
        <motion.div {...toolAnimation} className="flex gap-1 items-center">
            {tool.data.state === 'result' ? (
                <HoverCard openDelay={0}>
                    <HoverCardTrigger asChild>
                        <div className="flex gap-1 items-center text-xs text-muted-foreground cursor-pointer">
                            <CircleCheckBigIcon className="size-3" />
                            Retrieved Information
                        </div>
                    </HoverCardTrigger>
                    <HoverCardContent side="right" sideOffset={10} className="max-w-2xl w-full">
                        <ScrollArea className="h-[30vh] w-full text-xs">
                            {tool.data.result && (
                                <div className="space-y-2">
                                    <p>{tool.data.result}</p>
                                </div>
                            )}
                        </ScrollArea>
                    </HoverCardContent>
                </HoverCard>
            ) : (
                <TextShimmer className="text-sm">searching the knowledge base...</TextShimmer>
            )}
        </motion.div>
    ),
    default: ({ tool }) => {
        const formatToolName = (name?: string) => {
            if (!name) return 'Tool';
            return name
                .split('_')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        };

        const formatResult = (result: any) => {
            if (!result) return '';
            if (typeof result === 'string') return result;
            if (Array.isArray(result)) {
                return result.map((item, i) => (
                    <div key={i} className="mb-2">
                        {formatResult(item)}
                    </div>
                ));
            }
            if (typeof result === 'object') {
                return JSON.stringify(result, null, 2);
            }
            return String(result);
        };

        return (
            <motion.div {...toolAnimation} className="flex gap-1 items-center">
                {tool.data.state === 'result' ? (
                    <HoverCard openDelay={0}>
                        <HoverCardTrigger asChild>
                            <div className="flex gap-1 items-center text-xs text-muted-foreground cursor-pointer">
                                <CircleCheckBigIcon className="size-3" />
                                {formatToolName(tool.data.toolName)}
                            </div>
                        </HoverCardTrigger>
                        <HoverCardContent side="right" sideOffset={10} className="max-w-2xl w-full">
                            <ScrollArea className="h-[30vh] w-full text-xs">
                                {tool.data.result && (
                                    <div className="space-y-2">
                                        <p>{formatResult(tool.data.result)}</p>
                                    </div>
                                )}
                            </ScrollArea>
                        </HoverCardContent>
                    </HoverCard>
                ) : (
                    <div className="flex gap-1 items-center skeleton animate-pulse text-xs text-zinc-400">
                        <Loader2Icon className="size-3 animate-spin" />
                        Running {formatToolName(tool.data.toolName)}...
                    </div>
                )}
            </motion.div>
        );
    },
};

export function Tool({ tool, isOpen, onOpenChange }: ToolProps) {
    if (!tool?.data?.toolName) {
        return null;
    }
    const ToolComponent = ToolComponents[tool.data.toolName] || ToolComponents.default;
    return (
        <AnimatePresence mode="wait">
            <motion.div>
                <ToolComponent tool={tool} isOpen={isOpen} onOpenChange={onOpenChange} />
            </motion.div>
        </AnimatePresence>
    );
}
