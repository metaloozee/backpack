'use client';

import { BookCopyIcon, BrainCircuitIcon, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

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
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 rounded-md text-xs">
                        <BookCopyIcon className="size-3" />
                        {result &&
                            result.results &&
                            result.results.reduce(
                                (total: number, searchResult: any) =>
                                    total + searchResult.contexts.length,
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
                            {args?.knowledge_search_keywords?.map(
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
                        {result &&
                            result.results &&
                            result.results.map(
                                (searchResult: {
                                    keyword: string;
                                    contexts: Array<{
                                        content: string;
                                        knowledgeName: string;
                                        similarity: number;
                                    }>;
                                }) =>
                                    searchResult.contexts.map((context, index) => (
                                        <div
                                            key={index}
                                            className="bg-card rounded-md p-2 mb-2 border"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground font-medium">
                                                    {searchResult.keyword}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    ({Math.round(context.similarity * 100)}% match)
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
