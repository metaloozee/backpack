'use client';

import {
    BookCopyIcon,
    BrainCircuitIcon,
    BrainIcon,
    Globe2Icon,
    Loader2,
    TwitterIcon,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '../ui/button';

interface ToolProps {
    tool: any;
}

export function Tool({ tool }: ToolProps) {
    // Support both custom structure and standard Vercel AI SDK structure
    const toolInvocation = tool.toolInvocation || tool;
    const toolName = toolInvocation.toolName;
    const toolState = toolInvocation.state;
    const toolArgs = toolInvocation.args;
    const toolResult = toolInvocation.result;

    switch (toolName) {
        case 'research':
            return (
                <div className="">
                    {toolState === 'result' ? (
                        <div className="flex items-center gap-2 rounded-md px-4 py-2 bg-muted border max-w-fit text-xs">
                            <BrainIcon className="size-3" />
                            Research Plan Generated
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 rounded-md px-4 py-2 bg-muted border max-w-fit text-xs">
                            <Loader2 className="size-3 animate-spin" />
                            <BrainIcon className="size-3" />
                            Generating Research Plan...
                        </div>
                    )}
                </div>
            );
        case 'web_search':
            return (
                <div className="">
                    {toolState === 'result' ? (
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 rounded-md text-xs"
                                >
                                    <Globe2Icon className="size-3" />
                                    {toolResult &&
                                        toolResult.searches &&
                                        toolResult.searches.reduce(
                                            (total: number, searches: any) =>
                                                total + searches.results.length,
                                            0
                                        )}{' '}
                                    Web Pages Found
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="w-full sm:max-w-3xl">
                                <SheetHeader>
                                    <SheetTitle className="text-sm flex items-center gap-2 mb-2">
                                        <Globe2Icon className="size-4" /> Web Search Results
                                    </SheetTitle>
                                </SheetHeader>
                                <ScrollArea className="h-[calc(100vh-8rem)] text-xs break-words w-full pr-4">
                                    <div className="mb-4 flex flex-row flex-wrap gap-2 w-full">
                                        {toolArgs?.web_search_queries?.map(
                                            (query: string, index: number) => (
                                                <div
                                                    key={index}
                                                    className="rounded-md px-4 py-2 bg-muted text-xs shrink-0 flex justify-start items-center gap-2"
                                                >
                                                    <MagnifyingGlassIcon className="size-3" />
                                                    {query}
                                                </div>
                                            )
                                        )}
                                    </div>
                                    {toolResult &&
                                        toolResult.searches &&
                                        toolResult.searches.flatMap((item: any) =>
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
                            </SheetContent>
                        </Sheet>
                    ) : (
                        <div className="flex items-center gap-2 rounded-md px-4 py-2 bg-muted border max-w-fit text-xs">
                            <Loader2 className="size-3 animate-spin" />
                            <Globe2Icon className="size-3" />
                            Searching the web...
                        </div>
                    )}
                </div>
            );
        case 'knowledge_search':
            return (
                <div className="">
                    {toolState === 'result' ? (
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 rounded-md text-xs"
                                >
                                    <BookCopyIcon className="size-3" />
                                    {toolResult &&
                                        toolResult.results &&
                                        toolResult.results.reduce(
                                            (total: number, result: any) =>
                                                total + result.contexts.length,
                                            0
                                        )}{' '}
                                    Sources Found
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="w-full sm:max-w-3xl">
                                <SheetHeader>
                                    <SheetTitle className="text-sm flex items-center gap-2 mb-2">
                                        <BookCopyIcon className="size-4" /> Knowledge Base Results
                                    </SheetTitle>
                                </SheetHeader>
                                <ScrollArea className="h-[calc(100vh-8rem)] text-xs break-words w-full pr-4">
                                    <div className="mb-4 flex flex-row flex-wrap gap-2 w-full">
                                        {toolArgs?.knowledge_search_keywords?.map(
                                            (keyword: string, index: number) => (
                                                <div
                                                    key={index}
                                                    className="rounded-md px-4 py-2 bg-muted text-xs shrink-0 flex justify-start items-center gap-2"
                                                >
                                                    <BrainCircuitIcon className="size-3" />
                                                    {keyword}
                                                </div>
                                            )
                                        )}
                                    </div>
                                    {toolResult &&
                                        toolResult.results &&
                                        toolResult.results.map(
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
                            </SheetContent>
                        </Sheet>
                    ) : (
                        <div className="flex items-center gap-2 rounded-md px-4 py-2 bg-muted border max-w-fit text-xs">
                            <Loader2 className="size-3 animate-spin" />
                            <BookCopyIcon className="size-3" />
                            Searching knowledge base...
                        </div>
                    )}
                </div>
            );
        case 'x_search':
            return (
                <div className="">
                    {toolState === 'result' ? (
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 rounded-md text-xs"
                                >
                                    <TwitterIcon className="size-3" />X (Twitter) Results
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="w-full sm:max-w-3xl">
                                <SheetHeader>
                                    <SheetTitle className="text-sm flex items-center gap-2 mb-2">
                                        <TwitterIcon className="size-4" /> X (Twitter) Search
                                        Results
                                    </SheetTitle>
                                </SheetHeader>
                                <ScrollArea className="h-[calc(100vh-8rem)] text-xs break-words w-full pr-4">
                                    <div className="mb-4 flex flex-row flex-wrap gap-2 w-full">
                                        <div className="rounded-md px-4 py-2 bg-muted text-xs shrink-0 flex justify-start items-center gap-2">
                                            <TwitterIcon className="size-3" />
                                            {toolArgs?.x_search_query || 'Search Query'}
                                        </div>
                                    </div>
                                    <div className="bg-card rounded-md p-4 text-center text-muted-foreground">
                                        X (Twitter) search functionality is coming soon.
                                    </div>
                                </ScrollArea>
                            </SheetContent>
                        </Sheet>
                    ) : (
                        <div className="flex items-center gap-2 rounded-md px-4 py-2 bg-muted border max-w-fit text-xs">
                            <Loader2 className="size-3 animate-spin" />
                            <TwitterIcon className="size-3" />
                            Searching X (Twitter)...
                        </div>
                    )}
                </div>
            );
        case 'academic_search':
            return (
                <div className="">
                    {toolState === 'result' ? (
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 rounded-md text-xs"
                                >
                                    <BrainCircuitIcon className="size-3" />
                                    Academic Results
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="w-full sm:max-w-3xl">
                                <SheetHeader>
                                    <SheetTitle className="text-sm flex items-center gap-2 mb-2">
                                        <BrainCircuitIcon className="size-4" /> Academic Search
                                        Results
                                    </SheetTitle>
                                </SheetHeader>
                                <ScrollArea className="h-[calc(100vh-8rem)] text-xs break-words w-full pr-4">
                                    <div className="mb-4 flex flex-row flex-wrap gap-2 w-full">
                                        {toolArgs?.academic_search_queries?.map(
                                            (query: string, index: number) => (
                                                <div
                                                    key={index}
                                                    className="rounded-md px-4 py-2 bg-muted text-xs shrink-0 flex justify-start items-center gap-2"
                                                >
                                                    <BrainCircuitIcon className="size-3" />
                                                    {query}
                                                </div>
                                            )
                                        )}
                                    </div>
                                    <div className="bg-card rounded-md p-4 text-center text-muted-foreground">
                                        Academic search functionality is coming soon.
                                    </div>
                                </ScrollArea>
                            </SheetContent>
                        </Sheet>
                    ) : (
                        <div className="flex items-center gap-2 rounded-md px-4 py-2 bg-muted border max-w-fit text-xs">
                            <Loader2 className="size-3 animate-spin" />
                            <BrainCircuitIcon className="size-3" />
                            Searching academic papers...
                        </div>
                    )}
                </div>
            );
        default:
            return null;
    }
}
