'use client';

import { Globe2Icon, GlobeIcon, Loader2, LoaderCircleIcon, SearchIcon } from 'lucide-react';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from '@/components/ui/accordion';
import Link from 'next/link';

import { Disclosure, DisclosureContent, DisclosureTrigger } from '@/components/ui/disclosure';

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
            <Accordion className="w-full">
                <AccordionItem value={toolCallId} className="border bg-neutral-900 rounded-md px-4">
                    <AccordionTrigger className="gap-2 h-10 text-xs w-full flex items-center justify-between">
                        <span className="flex items-center gap-2 truncate">
                            <GlobeIcon className="size-3" />
                            {'Web Search'}
                        </span>
                        <ChevronDownIcon className="size-3 transition-transform duration-200 group-data-[expanded]:rotate-180" />
                    </AccordionTrigger>
                    <AccordionContent className="space-y-1">
                        {result?.searches?.map((searchGroup: SearchGroup, index: number) => (
                            <Disclosure
                                key={`${toolCallId}-${index}`}
                                className="w-full flex flex-col gap-2"
                            >
                                <DisclosureTrigger className="w-full">
                                    <div className="w-full flex flex-row justify-between">
                                        <span className="flex items-center gap-2 truncate text-xs text-neutral-400">
                                            <SearchIcon className="size-3" />
                                            {searchGroup.query}
                                        </span>
                                    </div>
                                </DisclosureTrigger>

                                <DisclosureContent>
                                    <ScrollArea className="px-3 pb-3">
                                        <div className="flex flex-row gap-2 w-max">
                                            {searchGroup.results.map(
                                                (searchResult: SearchResult, resIdx: number) => (
                                                    <div
                                                        key={`${searchGroup.query}-${resIdx}`}
                                                        className="bg-neutral-800 rounded-lg shadow-sm p-3 shrink-0 w-64 hover:shadow-md transition-shadow duration-200"
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
                                </DisclosureContent>
                            </Disclosure>
                        ))}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        );
    }

    return (
        <Accordion className="w-full">
            <AccordionItem value={toolCallId} className="border bg-neutral-900 rounded-md px-4">
                <AccordionTrigger className="gap-2 h-10 text-xs w-full flex items-center justify-between">
                    <span className="flex items-center gap-2 truncate">
                        <LoaderCircleIcon className="size-3 animate-spin" />
                        {'Web Search'}
                    </span>
                    <ChevronDownIcon className="size-3 transition-transform duration-200 group-data-[expanded]:rotate-180" />
                </AccordionTrigger>
                <AccordionContent className="space-y-1">
                    {args?.web_search_queries?.map((query, index) => (
                        <Disclosure
                            key={`${toolCallId}-${index}`}
                            className="w-full flex flex-col gap-2"
                        >
                            <DisclosureTrigger className="w-full">
                                <div className="w-full flex flex-row justify-between">
                                    <span className="flex items-center gap-2 truncate text-xs text-neutral-400">
                                        <LoaderCircleIcon className="size-3 animate-spin" />
                                        {query}
                                    </span>
                                </div>
                            </DisclosureTrigger>
                            <DisclosureContent>
                                <div className="flex items-center gap-2 text-xs px-3 pb-3 text-muted-foreground">
                                    <LoaderCircleIcon className="size-3 animate-spin" />
                                    Searching...
                                </div>
                            </DisclosureContent>
                        </Disclosure>
                    ))}
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}
