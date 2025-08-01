'use client';

import { GraduationCapIcon, SearchIcon } from 'lucide-react';
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
import Link from 'next/link';

interface AcademicSearchToolProps {
    toolCallId: string;
    input?: any;
    output?: Array<{
        query: string;
        results: Array<Paper>;
    }>;
}

type Paper = {
    title: string;
    authors?: string;
    url: string;
    abstract?: string;
};

export function AcademicSearchTool({ toolCallId, input, output }: AcademicSearchToolProps) {
    if (output) {
        return (
            <Accordion className="w-full">
                <AccordionItem value={toolCallId} className="border bg-neutral-900 rounded-md px-4">
                    <AccordionTrigger className="gap-2 h-10 text-xs w-full flex items-center justify-between">
                        <span className="flex items-center gap-2 truncate">
                            <GraduationCapIcon className="size-3" />
                            {'Academic Search'}
                        </span>
                        <ChevronDownIcon className="size-3 transition-transform duration-200 group-data-[expanded]:rotate-180" />
                    </AccordionTrigger>
                    <AccordionContent className="space-y-1">
                        {output && output.length > 0
                            ? output.map((searchGroup, index) => (
                                  <Disclosure
                                      key={`${toolCallId}-${index}`}
                                      className="w-full flex flex-col gap-2"
                                  >
                                      <DisclosureTrigger className="w-full">
                                          <div className="w-full flex flex-row justify-between">
                                              <span className="flex items-center gap-2 truncate text-xs text-neutral-400">
                                                  <SearchIcon className="size-3" />
                                                  {input?.academic_search_queries?.[index] ??
                                                      searchGroup.query}
                                              </span>
                                          </div>
                                      </DisclosureTrigger>
                                      <DisclosureContent>
                                          <ScrollArea className="px-3 pb-3">
                                              <div className="flex flex-row gap-2 w-max">
                                                  {searchGroup.results.map(
                                                      (paper: Paper, resIdx: number) => (
                                                          <div
                                                              key={`${searchGroup.query}-${resIdx}`}
                                                              className="bg-neutral-950 rounded-lg shadow-sm p-3 shrink-0 w-64 hover:shadow-md transition-shadow duration-200"
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
                                                      )
                                                  )}
                                              </div>
                                              <ScrollBar orientation="horizontal" />
                                          </ScrollArea>
                                      </DisclosureContent>
                                  </Disclosure>
                              ))
                            : input?.academic_search_queries?.map(
                                  (query: string, index: number) => (
                                      <Disclosure
                                          key={`${toolCallId}-placeholder-${index}`}
                                          className="w-full flex flex-col gap-2"
                                      >
                                          <DisclosureTrigger className="w-full">
                                              <div className="w-full flex flex-row justify-between">
                                                  <span className="flex items-center gap-2 truncate text-xs text-neutral-400">
                                                      <GraduationCapIcon className="size-3" />
                                                      {query}
                                                  </span>
                                              </div>
                                          </DisclosureTrigger>
                                          <DisclosureContent>
                                              <div className="bg-card rounded-md p-4 text-center text-muted-foreground">
                                                  Academic search functionality is coming soon.
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
                        {'Academic Search'}
                    </span>
                    <ChevronDownIcon className="size-3 transition-transform duration-200 group-data-[expanded]:rotate-180" />
                </AccordionTrigger>
                <AccordionContent className="space-y-1">
                    {input?.academic_search_queries?.map((query: string, index: number) => (
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
