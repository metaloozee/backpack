'use client';

import { BrainIcon } from 'lucide-react';
import { Loader } from '@/components/ui/loader';

interface ResearchToolProps {
    toolCallId: string;
    input?: {
        query?: string;
    };
    output?: any;
}

export function ResearchTool({ toolCallId, input, output }: ResearchToolProps) {
    if (output) {
        return (
            <div className="flex items-center gap-2 rounded-md px-4 py-2 bg-muted border max-w-fit text-xs">
                <BrainIcon className="size-3" />
                Research Plan Generated
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 rounded-md px-4 py-2 bg-muted border max-w-fit text-xs">
            <Loader size="sm" />
            {input?.query
                ? `Generating Research Plan for: "${input.query}"`
                : 'Generating Research Plan...'}
        </div>
    );
}
