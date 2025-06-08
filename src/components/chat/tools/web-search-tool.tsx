'use client';

import { Globe2Icon, Loader2 } from 'lucide-react';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface WebSearchToolProps {
    toolCallId: string;
    state: 'call' | 'result';
    args?: {
        web_search_queries?: string[];
    };
    result?: {
        searches?: Array<{
            query: string;
            results: Array<{
                title: string;
                url: string;
                content: string;
            }>;
        }>;
    };
}

export function WebSearchTool({ toolCallId, state, args, result }: WebSearchToolProps) {
    if (state === 'result') {
        return (
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 rounded-md text-xs">
                        <Globe2Icon className="size-3" />
                        {result &&
                            result.searches &&
                            result.searches.reduce(
                                (total: number, searches: any) => total + searches.results.length,
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
                            {args?.web_search_queries?.map((query: string, index: number) => (
                                <div
                                    key={index}
                                    className="rounded-md px-4 py-2 bg-muted text-xs shrink-0 flex justify-start items-center gap-2"
                                >
                                    <MagnifyingGlassIcon className="size-3" />
                                    {query}
                                </div>
                            ))}
                        </div>
                        {result &&
                            result.searches &&
                            result.searches.flatMap((item: any) =>
                                item.results.map((searchResult: any, index: number) => (
                                    <div
                                        key={`${item.query}-${index}`}
                                        className="bg-card rounded-md p-2 mb-2 border"
                                    >
                                        <Link
                                            href={searchResult.url}
                                            target="_blank"
                                            className="text-sm text-primary hover:underline truncate max-w-fit block font-medium"
                                        >
                                            <img
                                                src={`https://www.google.com/s2/favicons?domain=${new URL(searchResult.url).hostname}&sz=16`}
                                                alt="favicon"
                                                className="inline-block w-4 h-4 mr-1.5 align-middle"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display =
                                                        'none';
                                                }}
                                            />
                                            {searchResult.title}
                                        </Link>
                                        <p className="text-xs break-words text-muted-foreground text-justify mt-1">
                                            {searchResult.content.slice(0, 150)}
                                            ...
                                        </p>
                                    </div>
                                ))
                            )}
                    </ScrollArea>
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <div className="flex items-center gap-2 rounded-md px-4 py-2 bg-muted border max-w-fit text-xs">
            <Loader2 className="size-3 animate-spin" />
            <Globe2Icon className="size-3" />
            Searching the web...
        </div>
    );
}
