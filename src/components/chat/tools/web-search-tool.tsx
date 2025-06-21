'use client';

import { Globe2Icon, GlobeIcon, Loader2, SearchCheckIcon } from 'lucide-react';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from '@/components/ui/accordion';
import Link from 'next/link';

type SearchResult = {
    title: string;
    url: string;
    content: string;
};

type SearchGroup = {
    query: string;
    results: SearchResult[];
};

interface WebSearchToolProps {
    toolCallId: string;
    state: 'call' | 'result';
    args?: {
        web_search_queries?: string[];
    };
    result?: {
        searches?: SearchGroup[];
    };
}

export function WebSearchTool({ toolCallId, state, args, result }: WebSearchToolProps) {
    if (state === 'result') {
        return (
            <Accordion className="w-full space-y-2">
                {result?.searches?.map((searchGroup: SearchGroup, index: number) => (
                    <AccordionItem
                        value={`${toolCallId}-${index}`}
                        key={`${toolCallId}-${index}`}
                        className="border rounded-md"
                    >
                        <AccordionTrigger className="gap-2 h-10 text-xs w-full px-4 py-2 flex items-center justify-between">
                            <span className="flex items-center gap-2 truncate">
                                <GlobeIcon className="size-3" />
                                {args?.web_search_queries?.[index] ?? searchGroup.query}
                            </span>
                            <ChevronDownIcon className="size-3 transition-transform duration-200 group-data-[expanded]:rotate-180" />
                        </AccordionTrigger>
                        <AccordionContent>
                            <ScrollArea className="px-3 pb-3">
                                <div className="flex flex-row gap-2 w-max">
                                    {searchGroup.results.map(
                                        (searchResult: SearchResult, resIdx: number) => (
                                            <div
                                                key={`${searchGroup.query}-${resIdx}`}
                                                className="bg-neutral-900 rounded-lg shadow-sm border p-3 shrink-0 w-64 hover:shadow-md transition-shadow duration-200"
                                            >
                                                <Link
                                                    href={searchResult.url}
                                                    target="_blank"
                                                    className="text-sm font-medium text-primary hover:underline line-clamp-2"
                                                >
                                                    <img
                                                        src={`https://www.google.com/s2/favicons?domain=${new URL(searchResult.url).hostname}&sz=16`}
                                                        alt="favicon"
                                                        className="inline-block w-4 h-4 mr-1.5 align-middle"
                                                        onError={(e) => {
                                                            (
                                                                e.target as HTMLImageElement
                                                            ).style.display = 'none';
                                                        }}
                                                    />
                                                    {searchResult.title}
                                                </Link>
                                                <p className="mt-2 text-xs text-muted-foreground line-clamp-4">
                                                    {searchResult.content}
                                                </p>
                                            </div>
                                        )
                                    )}
                                </div>
                                <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        );
    }

    return (
        <div className="flex items-center gap-2 rounded-md px-4 py-2 bg-muted border max-w-fit text-xs">
            <Loader2 className="size-3 animate-spin" />
            <GlobeIcon className="size-3" />
            Searching the web...
        </div>
    );
}
