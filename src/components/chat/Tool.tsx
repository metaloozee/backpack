'use client';

import { motion, AnimatePresence } from 'motion/react';
import {
    BookCopyIcon,
    BrainCircuitIcon,
    CircleCheckBigIcon,
    Globe2Icon,
    Loader2Icon,
} from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TextShimmer } from '../ui/text-shimmer';
import Link from 'next/link';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { ToolInvocation } from 'ai';
import { BorderTrail } from '../ui/border-trail';
import {
    MorphingDialog,
    MorphingDialogContainer,
    MorphingDialogContent,
    MorphingDialogTitle,
    MorphingDialogTrigger,
} from '../ui/morphing-dialog';

interface ToolProps {
    tool: ToolInvocation;
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function Tool({ tool, isOpen, onOpenChange }: ToolProps) {
    console.log(tool.toolName);

    switch (tool.toolName) {
        case 'web_search':
            return (
                <div className="my-4">
                    {tool.state == 'result' ? (
                        <MorphingDialog
                            transition={{
                                type: 'spring',
                                stiffness: 200,
                                damping: 24,
                            }}
                        >
                            <MorphingDialogTrigger className="flex items-center gap-2 rounded-full px-4 py-2 bg-zinc-900/50 border max-w-fit">
                                <MorphingDialogTitle className="text-xs flex justify-start items-center gap-2">
                                    <Globe2Icon className="size-3" />
                                    {tool.result && tool.result.processedResults.length} Web Pages
                                </MorphingDialogTitle>
                            </MorphingDialogTrigger>
                            <MorphingDialogContainer>
                                <MorphingDialogContent className="relative h-auto rounded-md max-w-3xl w-full bg-zinc-900 border-2 p-4">
                                    <ScrollArea className="h-[50vh] text-xs break-words w-full">
                                        <div className="mb-4 flex flex-row flex-wrap gap-2 w-full">
                                            {tool.args.queries.map(
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
                                        {tool.result &&
                                            tool.result.processedResults.map(
                                                (item: any, index: number) => (
                                                    <div
                                                        key={index}
                                                        className="bg-black rounded-md p-2 mb-2"
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
                                </MorphingDialogContent>
                            </MorphingDialogContainer>
                        </MorphingDialog>
                    ) : (
                        <div className="relative flex items-center gap-2 rounded-full px-4 py-2 bg-zinc-900/50 border max-w-fit w-full">
                            <BorderTrail
                                style={{
                                    boxShadow:
                                        '0px 0px 60px 30px rgb(255 255 255 / 50%), 0 0 100px 60px rgb(0 0 0 / 50%), 0 0 140px 90px rgb(0 0 0 / 50%)',
                                }}
                                size={70}
                            />
                            <MagnifyingGlassIcon className="size-3" />
                            <TextShimmer className="text-xs">Searching the web...</TextShimmer>
                        </div>
                    )}
                </div>
            );
        case 'search_knowledge':
            return (
                <div className="my-4">
                    {tool.state == 'result' ? (
                        <MorphingDialog
                            transition={{
                                type: 'spring',
                                stiffness: 200,
                                damping: 24,
                            }}
                        >
                            <MorphingDialogTrigger className="flex items-center gap-2 rounded-full px-4 py-2 bg-zinc-900/50 border max-w-fit">
                                <MorphingDialogTitle className="text-xs flex justify-start items-center gap-2">
                                    <BookCopyIcon className="size-3" />
                                    {tool.result &&
                                        tool.result.results.reduce(
                                            (total: number, result: any) =>
                                                total + result.contexts.length,
                                            0
                                        )}{' '}
                                    Sources
                                </MorphingDialogTitle>
                            </MorphingDialogTrigger>
                            <MorphingDialogContainer>
                                <MorphingDialogContent className="relative h-auto rounded-md max-w-3xl w-full bg-zinc-900 border-2 p-4">
                                    <ScrollArea className="h-[50vh] text-xs break-words w-full">
                                        <div className="mb-4 flex flex-row flex-wrap gap-2 w-full">
                                            {tool.args.keywords.map(
                                                (keyword: string, index: number) => (
                                                    <div
                                                        key={index}
                                                        className="rounded-full px-4 py-2 bg-zinc-800/50 text-xs shrink-0 flex justify-start items-center gap-2"
                                                    >
                                                        <BrainCircuitIcon className="size-3 flex-1" />
                                                        {keyword}
                                                    </div>
                                                )
                                            )}
                                        </div>
                                        {tool.result &&
                                            tool.result.results.map(
                                                (result: {
                                                    keyword: string;
                                                    contexts: Array<{
                                                        content: string;
                                                        knowledgeName: string;
                                                        similarity: number;
                                                    }>;
                                                }) =>
                                                    result.contexts.map((context, index) => (
                                                        <div
                                                            key={index}
                                                            className="bg-black rounded-md p-2 mb-2"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-muted-foreground">
                                                                    {result.keyword}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    (
                                                                    {Math.round(
                                                                        context.similarity * 100
                                                                    )}
                                                                    % match)
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground truncate max-w-fit">
                                                                {context.knowledgeName}
                                                            </p>
                                                            <p className="text-xs break-words text-justify mt-1">
                                                                {context.content.slice(0, 200)}...
                                                            </p>
                                                        </div>
                                                    ))
                                            )}
                                    </ScrollArea>
                                </MorphingDialogContent>
                            </MorphingDialogContainer>
                        </MorphingDialog>
                    ) : (
                        <div className="relative flex items-center gap-2 rounded-full px-4 py-2 bg-zinc-900/50 border max-w-fit w-full">
                            <BorderTrail
                                style={{
                                    boxShadow:
                                        '0px 0px 60px 30px rgb(255 255 255 / 50%), 0 0 100px 60px rgb(0 0 0 / 50%), 0 0 140px 90px rgb(0 0 0 / 50%)',
                                }}
                                size={70}
                            />
                            <MagnifyingGlassIcon className="size-3" />
                            <TextShimmer className="text-xs">
                                Searching the knowledge base...
                            </TextShimmer>
                        </div>
                    )}
                </div>
            );
        default:
            return null;
    }
}
