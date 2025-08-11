'use client';

import { GlobeIcon, SearchIcon } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
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
    images?: {
        url: string;
        description: string;
    }[];
};

interface WebSearchToolProps {
    toolCallId: string;
    input?: {
        web_search_queries?: string[];
    };
    output?: {
        searches?: SearchGroup[];
    };
}

export function WebSearchTool({ toolCallId, input, output }: WebSearchToolProps) {
    const flattenedImages: { src: string; title: string; url: string; domain: string }[] =
        output?.searches
            ? Array.from(
                  new Map(
                      output.searches
                          .flatMap((group) => group.images || [])
                          .filter((img) => Boolean(img.url))
                          .map((img) => {
                              const src = img.url;
                              const url = img.url;
                              const domain = new URL(img.url).hostname.replace('www.', '');
                              const title = img.description || domain;
                              return [src, { src, title, url, domain }];
                          })
                  ).values()
              )
            : [];

    if (output) {
        return (
            <div className="w-full flex flex-col gap-2">
                {flattenedImages.length > 0 && (
                    <div className="mt-2">
                        <ScrollArea className="pb-2">
                            <div className="flex flex-row gap-3 w-max">
                                {flattenedImages.slice(0, 24).map((img) => (
                                    <a
                                        key={img.src}
                                        href={img.url}
                                        target="_blank"
                                        className="group relative block h-40 w-64 overflow-hidden rounded-lg transition-all duration-200"
                                    >
                                        <img
                                            src={img.src}
                                            alt={img.title}
                                            loading="lazy"
                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                            onError={(e) => {
                                                (
                                                    e.currentTarget as HTMLImageElement
                                                ).style.display = 'none';
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                                        <div className="absolute top-2 left-2 flex items-center gap-2 rounded px-2 py-1 text-[10px] bg-black/50 text-white/80 backdrop-blur">
                                            <img
                                                src={`https://www.google.com/s2/favicons?domain=${img.domain}&sz=16`}
                                                alt="favicon"
                                                className="size-3.5 rounded"
                                                onError={(ev) => {
                                                    (
                                                        ev.currentTarget as HTMLImageElement
                                                    ).style.display = 'none';
                                                }}
                                            />
                                            <span className="truncate max-w-[9rem]">
                                                {img.domain}
                                            </span>
                                        </div>
                                        <div className="absolute bottom-2 left-2 right-2 text-[11px] leading-tight text-white/95 line-clamp-2">
                                            {img.title}
                                        </div>
                                    </a>
                                ))}
                            </div>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </div>
                )}

                <Accordion className="w-full">
                    <AccordionItem
                        value={toolCallId}
                        className="border bg-neutral-900 rounded-md px-4"
                    >
                        <AccordionTrigger className="gap-2 h-10 text-xs w-full flex items-center justify-between">
                            <span className="flex items-center gap-2 truncate">
                                <GlobeIcon className="size-3" />
                                {'Web Search'}
                            </span>
                            <ChevronDownIcon className="size-3 transition-transform duration-200 group-data-[expanded]:rotate-180" />
                        </AccordionTrigger>
                        <AccordionContent className="space-y-1">
                            {output?.searches?.map((searchGroup: SearchGroup, index: number) => (
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
                                                    (
                                                        searchResult: SearchResult,
                                                        resIdx: number
                                                    ) => (
                                                        <div
                                                            key={`${searchGroup.query}-${resIdx}`}
                                                            className="bg-neutral-950 rounded-lg shadow-sm p-3 shrink-0 w-64 hover:shadow-md transition-shadow duration-200"
                                                        >
                                                            <Link
                                                                href={searchResult.url}
                                                                target="_blank"
                                                                className="text-sm font-medium text-primary hover:underline line-clamp-2"
                                                            >
                                                                <img
                                                                    src={`https://www.google.com/s2/favicons?domain=${new URL(searchResult.url).hostname}&sz=16`}
                                                                    alt="favicon"
                                                                    className="inline-block size-6 border-3 mr-1.5 align-middle rounded"
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
            </div>
        );
    }

    return (
        <Accordion className="w-full">
            <AccordionItem value={toolCallId} className="border bg-neutral-900 rounded-md px-4">
                <AccordionTrigger className="gap-2 h-10 text-xs w-full flex items-center justify-between">
                    <span className="flex items-center gap-2 truncate">
                        <Loader size="sm" />
                        {'Web Search'}
                    </span>
                    <ChevronDownIcon className="size-3 transition-transform duration-200 group-data-[expanded]:rotate-180" />
                </AccordionTrigger>
                <AccordionContent className="space-y-1">
                    {input?.web_search_queries?.map((query: string, index: number) => (
                        <Disclosure
                            key={`${toolCallId}-${index}`}
                            className="w-full flex flex-col gap-2"
                        >
                            <DisclosureTrigger className="w-full">
                                <div className="w-full flex flex-row justify-between">
                                    <span className="flex items-center gap-2 truncate text-xs text-neutral-400">
                                        <Loader size="sm" />
                                        {query}
                                    </span>
                                </div>
                            </DisclosureTrigger>
                            <DisclosureContent>
                                <div className="flex items-center gap-2 text-xs px-3 pb-3 text-muted-foreground">
                                    <Loader size="sm" />
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
