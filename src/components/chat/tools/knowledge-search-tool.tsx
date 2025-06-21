'use client';

import { BookCopyIcon, Loader2 } from 'lucide-react';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from '@/components/ui/accordion';

interface KnowledgeSearchToolProps {
    toolCallId: string;
    state: 'call' | 'result';
    args?: {
        knowledge_search_keywords?: string[];
    };
    result?: {
        results?: Array<{
            keyword: string;
            contexts: Array<{
                content: string;
                knowledgeName: string;
                similarity: number;
            }>;
        }>;
    };
}

export function KnowledgeSearchTool({ toolCallId, state, args, result }: KnowledgeSearchToolProps) {
    if (state === 'result') {
        return (
            <Accordion className="w-full space-y-2">
                {result?.results && result.results.length > 0
                    ? result.results.map((searchResult, index) => (
                          <AccordionItem
                              key={`${toolCallId}-${index}`}
                              value={`${toolCallId}-${index}`}
                              className="border rounded-md"
                          >
                              <AccordionTrigger className="gap-2 h-10 text-xs w-full px-4 py-2 flex items-center justify-between">
                                  <span className="flex items-center gap-2 truncate">
                                      <BookCopyIcon className="size-3" />
                                      {args?.knowledge_search_keywords?.[index] ??
                                          searchResult.keyword}
                                  </span>
                                  <ChevronDownIcon className="size-3 transition-transform duration-200 group-data-[expanded]:rotate-180" />
                              </AccordionTrigger>
                              <AccordionContent>
                                  <ScrollArea className="px-3 pb-3">
                                      <div className="flex flex-row gap-2 w-max">
                                          {searchResult.contexts.map((context, ctxIdx) => (
                                              <div
                                                  key={`${searchResult.keyword}-${ctxIdx}`}
                                                  className="bg-neutral-900 rounded-lg shadow-sm border p-3 shrink-0 w-64 hover:shadow-md transition-shadow duration-200"
                                              >
                                                  <p className="text-sm font-medium text-primary line-clamp-2">
                                                      {context.knowledgeName}
                                                  </p>
                                                  <p className="mt-1 text-xs text-muted-foreground">
                                                      {Math.round(context.similarity * 100)}% match
                                                  </p>
                                                  <p className="mt-2 text-xs text-muted-foreground line-clamp-4">
                                                      {context.content}
                                                  </p>
                                              </div>
                                          ))}
                                      </div>
                                      <ScrollBar orientation="horizontal" />
                                  </ScrollArea>
                              </AccordionContent>
                          </AccordionItem>
                      ))
                    : args?.knowledge_search_keywords?.map((keyword, index) => (
                          <AccordionItem
                              key={`${toolCallId}-placeholder-${index}`}
                              value={`${toolCallId}-placeholder-${index}`}
                              className="border rounded-md"
                          >
                              <AccordionTrigger className="gap-2 h-10 text-xs w-full px-4 py-2 flex items-center justify-between">
                                  <span className="flex items-center gap-2 truncate">
                                      <BookCopyIcon className="size-3" />
                                      {keyword}
                                  </span>
                                  <ChevronDownIcon className="size-3 transition-transform duration-200 group-data-[expanded]:rotate-180" />
                              </AccordionTrigger>
                              <AccordionContent>
                                  <div className="bg-card rounded-md p-4 text-center text-muted-foreground">
                                      No results found.
                                  </div>
                              </AccordionContent>
                          </AccordionItem>
                      ))}
            </Accordion>
        );
    }

    return (
        <div className="flex items-center gap-2 rounded-md px-4 py-2 bg-muted border max-w-fit text-xs">
            <Loader2 className="size-3 animate-spin" />
            <BookCopyIcon className="size-3" />
            Searching knowledge base...
        </div>
    );
}
