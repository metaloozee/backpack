'use client';

import { PickaxeIcon } from 'lucide-react';
import { Loader } from '@/components/ui/loader';

type ExtractResult = {
    url: string;
    images: string[] | undefined;
    content: string;
};

interface ExtractToolProps {
    toolCallId: string;
    input?: {
        urls?: string[];
    };
    output?: ExtractResult[];
}

export function ExtractTool({ toolCallId, input, output }: ExtractToolProps) {
    if (output) {
        return (
            <div className="w-full border bg-neutral-900 rounded-md px-4 py-3">
                <div className="w-full flex flex-col gap-2">
                    {output?.map((result: ExtractResult, index: number) => (
                        <div key={`${toolCallId}-${index}`} className="w-full flex flex-col gap-2">
                            <div className="w-full flex shrink-0 flex-row justify-start items-center gap-2">
                                <PickaxeIcon className="size-3" />
                                <span className="text-xs truncate">{result.url}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full border bg-neutral-900 rounded-md px-4 py-3">
            <div className="w-full flex flex-col gap-2">
                {input?.urls?.map((url: string, index: number) => (
                    <div key={`${toolCallId}-${index}`} className="w-full flex flex-col gap-2">
                        <div className="w-full flex shrink-0 flex-row justify-start items-center gap-2">
                            <Loader size="sm" />
                            <span className="text-xs text-neutral-400 truncate">{url}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
