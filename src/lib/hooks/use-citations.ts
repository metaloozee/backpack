import { useMemo } from 'react';

export interface Citation {
    id: number;
    title: string;
    url: string;
    content?: string;
}

export interface CitationResult {
    processedContent: string;
    citations: Citation[];
}

export function useCitations(content: string): CitationResult {
    return useMemo(() => {
        const citations: Citation[] = [];
        let citationCounter = 0;

        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

        const processedContent = content.replace(linkRegex, (match, title, url) => {
            let existingCitation = citations.find((c) => c.url === url);

            if (!existingCitation) {
                citationCounter++;
                existingCitation = {
                    id: citationCounter,
                    title: title.trim(),
                    url: url.trim(),
                    content: '',
                };
                citations.push(existingCitation);
            }

            return `[${existingCitation.id}]`;
        });

        return {
            processedContent,
            citations,
        };
    }, [content]);
}
