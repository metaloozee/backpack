'use client';

import { BookCopyIcon, SearchIcon } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from '@/components/ui/accordion';
import { Disclosure, DisclosureContent, DisclosureTrigger } from '@/components/ui/disclosure';

interface KnowledgeContext {
    content: string;
    knowledgeName: string;
    similarity: number;
}

interface KnowledgeSearchResult {
    keyword: string;
    contexts: KnowledgeContext[];
}

interface KnowledgeSearchToolProps {
    toolCallId: string;
    input?: {
        knowledge_search_keywords?: string[];
    };
    output?: {
        results?: KnowledgeSearchResult[];
    };
}

export function KnowledgeSearchTool({ toolCallId, input, output }: KnowledgeSearchToolProps) {
    if (output) {
        return (
            <Accordion className="w-full">
                <AccordionItem value={toolCallId} className="border bg-neutral-900 rounded-md px-4">
                    <AccordionTrigger className="gap-2 h-10 text-xs w-full flex items-center justify-between">
                        <span className="flex items-center gap-2 truncate">
                            <BookCopyIcon className="size-3" />
                            {'Knowledge Search'}
                        </span>
                        <ChevronDownIcon className="size-3 transition-transform duration-200 group-data-[expanded]:rotate-180" />
                    </AccordionTrigger>
                    <AccordionContent className="space-y-1">
                        {output?.results && output.results.length > 0
                            ? output.results.map((searchResult, index) => (
                                  <Disclosure
                                      key={`${toolCallId}-${index}`}
                                      className="w-full flex flex-col gap-2"
                                  >
                                      <DisclosureTrigger className="w-full">
                                          <div className="w-full flex flex-row justify-between">
                                              <span className="flex items-center gap-2 truncate text-xs text-neutral-400">
                                                  <SearchIcon className="size-3" />
                                                  {input?.knowledge_search_keywords?.[index] ??
                                                      searchResult.keyword}
                                              </span>
                                          </div>
                                      </DisclosureTrigger>
                                      <DisclosureContent>
                                          <ScrollArea className="px-3 pb-3">
                                              <div className="flex flex-row gap-2 w-max">
                                                  {searchResult.contexts.map(
                                                      (
                                                          context: KnowledgeContext,
                                                          ctxIdx: number
                                                      ) => (
                                                          <div
                                                              key={`${searchResult.keyword}-${ctxIdx}`}
                                                              className="bg-neutral-950 rounded-lg shadow-sm p-3 shrink-0 w-64 hover:shadow-md transition-shadow duration-200"
                                                          >
                                                              <p className="text-sm font-medium text-primary line-clamp-2">
                                                                  {context.knowledgeName}
                                                              </p>
                                                              <p className="mt-1 text-xs text-muted-foreground">
                                                                  {Math.round(
                                                                      context.similarity * 100
                                                                  )}
                                                                  % match
                                                              </p>
                                                              <p className="mt-2 text-xs text-muted-foreground line-clamp-4">
                                                                  {context.content}
                                                              </p>
                                                          </div>
                                                      )
                                                  )}
                                              </div>
                                              <ScrollBar orientation="horizontal" />
                                          </ScrollArea>
                                      </DisclosureContent>
                                  </Disclosure>
                              ))
                            : input?.knowledge_search_keywords?.map(
                                  (keyword: string, index: number) => (
                                      <Disclosure
                                          key={`${toolCallId}-placeholder-${index}`}
                                          className="w-full flex flex-col gap-2"
                                      >
                                          <DisclosureTrigger className="w-full">
                                              <div className="w-full flex flex-row justify-between">
                                                  <span className="flex items-center gap-2 truncate text-xs text-neutral-400">
                                                      <BookCopyIcon className="size-3" />
                                                      {keyword}
                                                  </span>
                                              </div>
                                          </DisclosureTrigger>
                                          <DisclosureContent>
                                              <div className="bg-card rounded-md p-4 text-center text-muted-foreground">
                                                  No results found.
                                              </div>
                                          </DisclosureContent>
                                      </Disclosure>
                                  )
                              )}
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
                        <Loader size="sm" />
                        {'Knowledge Search'}
                    </span>
                    <ChevronDownIcon className="size-3 transition-transform duration-200 group-data-[expanded]:rotate-180" />
                </AccordionTrigger>
                <AccordionContent className="space-y-1">
                    {input?.knowledge_search_keywords?.map((keyword: string, index: number) => (
                        <Disclosure
                            key={`${toolCallId}-${index}`}
                            className="w-full flex flex-col gap-2"
                        >
                            <DisclosureTrigger className="w-full">
                                <div className="w-full flex flex-row justify-between">
                                    <span className="flex items-center gap-2 truncate text-xs text-neutral-400">
                                        <Loader size="sm" />
                                        {keyword}
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
