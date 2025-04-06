'use client';

import { BookCopyIcon, BrainCircuitIcon, BrainIcon, Globe2Icon, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '../ui/button';

interface ToolProps {
    tool: any;
}

export function Tool({ tool }: ToolProps) {
    switch (tool.toolInvocation.toolName) {
        case 'research':
            return (
                <div className="my-4">
                    {tool.toolInvocation.state === 'result' ? (
                        <div className="flex items-center gap-2 rounded-full px-4 py-2 bg-muted border max-w-fit text-xs">
                            <BrainIcon className="size-3" />
                            Research Plan Generated
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 rounded-full px-4 py-2 bg-muted border max-w-fit text-xs">
                            <Loader2 className="size-3 animate-spin" />
                            <BrainIcon className="size-3" />
                            Generating Research Plan...
                        </div>
                    )}
                </div>
            );
        case 'web_search':
            return (
                <div className="my-4">
                    {tool.toolInvocation.state === 'result' ? (
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 rounded-full text-xs"
                                >
                                    <Globe2Icon className="size-3" />
                                    {tool.toolInvocation.result &&
                                        tool.toolInvocation.result.searches.reduce(
                                            (total: number, searches: any) =>
                                                total + searches.results.length,
                                            0
                                        )}{' '}
                                    Web Pages Found
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl w-full p-4">
                                <DialogHeader>
                                    <DialogTitle className="text-sm flex items-center gap-2 mb-2">
                                        <Globe2Icon className="size-4" /> Web Search Results
                                    </DialogTitle>
                                </DialogHeader>
                                <ScrollArea className="h-[50vh] text-xs break-words w-full pr-4">
                                    <div className="mb-4 flex flex-row flex-wrap gap-2 w-full">
                                        {tool.toolInvocation.args.web_search_queries.map(
                                            (query: string, index: number) => (
                                                <div
                                                    key={index}
                                                    className="rounded-full px-4 py-2 bg-muted text-xs shrink-0 flex justify-start items-center gap-2"
                                                >
                                                    <MagnifyingGlassIcon className="size-3" />
                                                    {query}
                                                </div>
                                            )
                                        )}
                                    </div>
                                    {tool.toolInvocation.result &&
                                        tool.toolInvocation.result.searches.flatMap((item: any) =>
                                            item.results.map((result: any, index: number) => (
                                                <div
                                                    key={`${item.query}-${index}`}
                                                    className="bg-card rounded-md p-2 mb-2 border"
                                                >
                                                    <Link
                                                        href={result.url}
                                                        target="_blank"
                                                        className="text-sm text-primary hover:underline truncate max-w-fit block font-medium"
                                                    >
                                                        <img
                                                            src={`https://www.google.com/s2/favicons?domain=${new URL(result.url).hostname}&sz=16`}
                                                            alt="favicon"
                                                            className="inline-block w-4 h-4 mr-1.5 align-middle"
                                                            onError={(e) => {
                                                                (
                                                                    e.target as HTMLImageElement
                                                                ).style.display = 'none';
                                                            }}
                                                        />
                                                        {result.title}
                                                    </Link>
                                                    <p className="text-xs break-words text-muted-foreground text-justify mt-1">
                                                        {result.content.slice(0, 150)}
                                                        ...
                                                    </p>
                                                </div>
                                            ))
                                        )}
                                </ScrollArea>
                            </DialogContent>
                        </Dialog>
                    ) : (
                        <div className="flex items-center gap-2 rounded-full px-4 py-2 bg-muted border max-w-fit text-xs">
                            <Loader2 className="size-3 animate-spin" />
                            <Globe2Icon className="size-3" />
                            Searching the web...
                        </div>
                    )}
                </div>
            );
        case 'knowledge_search':
            return (
                <div className="my-4">
                    {tool.toolInvocation.state == 'result' ? (
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 rounded-full text-xs"
                                >
                                    <BookCopyIcon className="size-3" />
                                    {tool.toolInvocation.result &&
                                        tool.toolInvocation.result.results.reduce(
                                            (total: number, result: any) =>
                                                total + result.contexts.length,
                                            0
                                        )}{' '}
                                    Sources Found
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl w-full p-4">
                                <DialogHeader>
                                    <DialogTitle className="text-sm flex items-center gap-2 mb-2">
                                        <BookCopyIcon className="size-4" /> Knowledge Base Results
                                    </DialogTitle>
                                </DialogHeader>
                                <ScrollArea className="h-[50vh] text-xs break-words w-full pr-4">
                                    <div className="mb-4 flex flex-row flex-wrap gap-2 w-full">
                                        {tool.toolInvocation.args.knowledge_search_keywords.map(
                                            (keyword: string, index: number) => (
                                                <div
                                                    key={index}
                                                    className="rounded-full px-4 py-2 bg-muted text-xs shrink-0 flex justify-start items-center gap-2"
                                                >
                                                    <BrainCircuitIcon className="size-3" />
                                                    {keyword}
                                                </div>
                                            )
                                        )}
                                    </div>
                                    {tool.toolInvocation.result &&
                                        tool.toolInvocation.result.results.map(
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
                                                        className="bg-card rounded-md p-2 mb-2 border"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-muted-foreground font-medium">
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
                                                        <p className="text-sm text-primary truncate max-w-fit font-medium">
                                                            {context.knowledgeName}
                                                        </p>
                                                        <p className="text-xs break-words text-muted-foreground text-justify mt-1">
                                                            {context.content.slice(0, 200)}...
                                                        </p>
                                                    </div>
                                                ))
                                        )}
                                </ScrollArea>
                            </DialogContent>
                        </Dialog>
                    ) : (
                        <div className="flex items-center gap-2 rounded-full px-4 py-2 bg-muted border max-w-fit text-xs">
                            <Loader2 className="size-3 animate-spin" />
                            <BookCopyIcon className="size-3" />
                            Searching knowledge base...
                        </div>
                    )}
                </div>
            );
        default:
            return null;
    }
}
