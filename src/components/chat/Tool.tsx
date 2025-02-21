'use client';

import { motion, AnimatePresence } from 'motion/react';
import { CircleCheckBigIcon, Globe2Icon, Loader2Icon } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TextShimmer } from '../ui/text-shimmer';
import Link from 'next/link';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { ToolInvocation } from 'ai';

interface ToolProps {
    tool: ToolInvocation;
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

export function Tool({ tool, isOpen, onOpenChange }: ToolProps) {
    switch (tool.toolName) {
        case 'web_search':
            return (
                <motion.div {...toolAnimation} className="flex gap-1 items-center">
                    {tool.state === 'result' ? (
                        <HoverCard openDelay={0}>
                            <HoverCardTrigger asChild>
                                <div className="my-4 px-4 py-2 rounded-full bg-zinc-800/50 text-xs flex justify-start items-center gap-2">
                                    <Globe2Icon className="size-3" />
                                    {tool.result && tool.result.processedResults.length} Web Pages
                                </div>
                            </HoverCardTrigger>
                            <HoverCardContent
                                side="top"
                                sideOffset={10}
                                className="max-w-2xl w-full"
                            >
                                <ScrollArea className="h-[30vh] text-xs break-words w-full">
                                    <div className="mb-4 flex flex-row flex-wrap gap-2 w-full">
                                        {tool.args.queries.map((query: string, index: number) => (
                                            <div
                                                key={index}
                                                className="rounded-full px-4 py-2 bg-zinc-800/50 text-xs shrink-0 flex justify-start items-center gap-2"
                                            >
                                                <MagnifyingGlassIcon className="size-3 flex-1" />
                                                {query}
                                            </div>
                                        ))}
                                    </div>
                                    {tool.result &&
                                        tool.result.processedResults.map(
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
            );
        default:
            return null;
    }
}
