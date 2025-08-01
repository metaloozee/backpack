'use client';

import { Brain } from 'lucide-react';
import { Loader } from '@/components/ui/loader';

interface SaveToMemoriesToolProps {
    toolCallId: string;
    input?: {
        contents?: string[];
    };
    output?: {
        saved_count: number;
        total_count: number;
    };
}

export function SaveToMemoriesTool({ toolCallId, input, output }: SaveToMemoriesToolProps) {
    if (output) {
        return (
            <div className="w-full border bg-neutral-900 rounded-md px-4 py-3">
                <div className="w-full flex flex-row items-center gap-2">
                    <Brain className="size-3" />
                    <span className="text-xs truncate">
                        {`Saved ${output?.saved_count ?? 0} of ${output?.total_count ?? 0} memories`}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full border bg-neutral-900 rounded-md px-4 py-3">
            <div className="w-full flex flex-row items-center gap-2">
                <Loader size="sm" />
                <span className="text-xs text-neutral-400">Saving memories...</span>
            </div>
        </div>
    );
}
