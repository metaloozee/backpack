'use client';

import { BrainIcon, Loader2 } from 'lucide-react';

interface ResearchToolProps {
    toolCallId: string;
    state: 'call' | 'result';
    args?: any;
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
            <Loader2 className="size-3 animate-spin" />
            <BrainIcon className="size-3" />
            Generating Research Plan...
        </div>
    );
}
