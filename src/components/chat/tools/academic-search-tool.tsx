'use client';

import { BrainCircuitIcon, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface AcademicSearchToolProps {
    toolCallId: string;
    state: 'call' | 'result';
    args?: {
        academic_search_queries?: string[];
    };
    result?: any;
}

export function AcademicSearchTool({ toolCallId, state, args, result }: AcademicSearchToolProps) {
    if (state === 'result') {
        return (
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 rounded-md text-xs">
                        <BrainCircuitIcon className="size-3" />
                        Academic Results
                    </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-3xl">
                    <SheetHeader>
                        <SheetTitle className="text-sm flex items-center gap-2 mb-2">
                            <BrainCircuitIcon className="size-4" /> Academic Search Results
                        </SheetTitle>
                    </SheetHeader>
                    <ScrollArea className="h-[calc(100vh-8rem)] text-xs break-words w-full pr-4">
                        <div className="mb-4 flex flex-row flex-wrap gap-2 w-full">
                            {args?.academic_search_queries?.map((query: string, index: number) => (
                                <div
                                    key={index}
                                    className="rounded-md px-4 py-2 bg-muted text-xs shrink-0 flex justify-start items-center gap-2"
                                >
                                    <BrainCircuitIcon className="size-3" />
                                    {query}
                                </div>
                            ))}
                        </div>
                        <div className="bg-card rounded-md p-4 text-center text-muted-foreground">
                            Academic search functionality is coming soon.
                        </div>
                    </ScrollArea>
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <div className="flex items-center gap-2 rounded-md px-4 py-2 bg-muted border max-w-fit text-xs">
            <Loader2 className="size-3 animate-spin" />
            <BrainCircuitIcon className="size-3" />
            Searching academic papers...
        </div>
    );
}
