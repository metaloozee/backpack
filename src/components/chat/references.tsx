'use client';

import React from 'react';
import { Citation as CitationType } from '@/lib/hooks/use-citations';
import { ExternalLinkIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface ReferencesProps {
    citations: CitationType[];
}

export function References({ citations }: ReferencesProps) {
    if (citations.length === 0) return null;

    return (
        <div className="mt-6 pt-4">
            <Separator className="mb-4" />
            <h4 className="text-sm font-medium text-muted-foreground mb-3">References</h4>
            <div className="space-y-2">
                {citations.map((citation) => (
                    <div key={citation.id} className="flex items-start gap-2 text-xs">
                        <span className="flex-shrink-0 w-6 text-muted-foreground">
                            [{citation.id}]
                        </span>
                        <div className="flex-1">
                            <a
                                href={citation.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                            >
                                {citation.title}
                                <ExternalLinkIcon className="h-3 w-3" />
                            </a>
                            <div className="text-muted-foreground mt-0.5">
                                {(() => {
                                    try {
                                        return new URL(citation.url).hostname;
                                    } catch {
                                        return citation.url;
                                    }
                                })()}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
