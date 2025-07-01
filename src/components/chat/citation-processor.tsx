'use client';

import React from 'react';
import { useCitations } from '@/lib/hooks/use-citations';
import { Citation } from './citation';
import { TooltipProvider } from '@/components/ui/tooltip';

interface CitationProcessorProps {
    content: string;
}

export function CitationProcessor({ content }: CitationProcessorProps) {
    const { processedContent, citations } = useCitations(content);

    const renderContentWithCitations = (text: string) => {
        const citationRegex = /\[(\d+)\]/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = citationRegex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parts.push(text.slice(lastIndex, match.index));
            }

            const citationId = parseInt(match[1]);
            const citation = citations.find((c) => c.id === citationId);

            if (citation) {
                parts.push(
                    <Citation key={`citation-${citation.id}-${match.index}`} citation={citation} />
                );
            } else {
                parts.push(match[0]);
            }

            lastIndex = match.index + match[0].length;
        }

        if (lastIndex < text.length) {
            parts.push(text.slice(lastIndex));
        }

        return parts;
    };

    return (
        <TooltipProvider>
            <span>{renderContentWithCitations(processedContent)}</span>
        </TooltipProvider>
    );
}
