'use client';

import { GraduationCapIcon, Loader2 } from 'lucide-react';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from '@/components/ui/accordion';
import Link from 'next/link';

interface AcademicSearchToolProps {
    toolCallId: string;
    state: 'call' | 'result';
    args?: {
        academic_search_queries?: string[];
    };
    result?: {
        searches?: Array<{
            query: string;
            results: Array<{
                title: string;
                authors?: string;
                url: string;
                abstract?: string;
            }>;
        }>;
    };
}

export function AcademicSearchTool({ toolCallId, state, args, result }: AcademicSearchToolProps) {
    if (state === 'result') {
        return (
            <Accordion className="w-full space-y-2">
                {result?.searches && result.searches.length > 0
                    ? result.searches.map((searchGroup, index) => (
                          <AccordionItem
                              key={`${toolCallId}-${index}`}
                              value={`${toolCallId}-${index}`}
                              className="border rounded-md"
                          >
                              <AccordionTrigger className="gap-2 h-10 text-xs w-full px-4 py-2 flex items-center justify-between">
                                  <span className="flex items-center gap-2 truncate">
                                      <GraduationCapIcon className="size-3" />
                                      {args?.academic_search_queries?.[index] ?? searchGroup.query}
                                  </span>
                                  <ChevronDownIcon className="size-3 transition-transform duration-200 group-data-[expanded]:rotate-180" />
                              </AccordionTrigger>
                              <AccordionContent>
                                  <ScrollArea className="px-3 pb-3">
                                      <div className="flex flex-row gap-2 w-max">
                                          {searchGroup.results.map((paper, resIdx) => (
                                              <div
                                                  key={`${searchGroup.query}-${resIdx}`}
                                                  className="bg-neutral-900 rounded-lg shadow-sm border p-3 shrink-0 w-64 hover:shadow-md transition-shadow duration-200"
                                              >
                                                  <Link
                                                      href={paper.url}
                                                      target="_blank"
                                                      className="text-sm font-medium text-primary hover:underline line-clamp-2"
                                                  >
                                                      {paper.title}
                                                  </Link>
                                                  {paper.authors && (
                                                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                                                          {paper.authors}
                                                      </p>
                                                  )}
                                                  {paper.abstract && (
                                                      <p className="mt-2 text-xs text-muted-foreground line-clamp-4">
                                                          {paper.abstract}
                                                      </p>
                                                  )}
                                              </div>
                                          ))}
                                      </div>
                                      <ScrollBar orientation="horizontal" />
                                  </ScrollArea>
                              </AccordionContent>
                          </AccordionItem>
                      ))
                    : args?.academic_search_queries?.map((query, index) => (
                          <AccordionItem
                              key={`${toolCallId}-placeholder-${index}`}
                              value={`${toolCallId}-placeholder-${index}`}
                              className="border rounded-md"
                          >
                              <AccordionTrigger className="gap-2 h-10 text-xs w-full px-4 py-2 flex items-center justify-between">
                                  <span className="flex items-center gap-2 truncate">
                                      <GraduationCapIcon className="size-3" />
                                      {query}
                                  </span>
                                  <ChevronDownIcon className="size-3 transition-transform duration-200 group-data-[expanded]:rotate-180" />
                              </AccordionTrigger>
                              <AccordionContent>
                                  <div className="bg-card rounded-md p-4 text-center text-muted-foreground">
                                      Academic search functionality is coming soon.
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
            <GraduationCapIcon className="size-3" />
            Searching academic papers...
        </div>
    );
}
