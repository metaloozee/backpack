'use client';

import { BrainIcon } from 'lucide-react';
import { Loader } from '@/components/ui/loader';

interface ResearchToolProps {
    toolCallId: string;
    state: 'call' | 'result';
    args?: {
        query?: string;
    };
    result?: any;
}

export function ResearchTool({ toolCallId, state, args, result }: ResearchToolProps) {
    if (state === 'result') {
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
            {args?.query
                ? `Generating Research Plan for: "${args.query}"`
                : 'Generating Research Plan...'}
        </div>
    );
}
