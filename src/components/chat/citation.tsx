'use client';

import React, { useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
    FileIcon,
    FileTextIcon,
    BookOpenIcon,
    ExternalLinkIcon,
    ImageIcon,
    VideoIcon,
    FileSpreadsheetIcon,
    PresentationIcon,
    NotebookTabsIcon,
} from 'lucide-react';
import { Citation as CitationType } from '@/lib/hooks/use-citations';

interface CitationProps {
    citation: CitationType;
}

function FaviconIcon({ domain }: { domain: string }) {
    const [faviconError, setFaviconError] = useState(false);
    const [faviconLoaded, setFaviconLoaded] = useState(false);

    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;

    if (faviconError) {
        return <NotebookTabsIcon className="size-4 mt-0.5 flex-shrink-0 fill-current" />;
    }

    return (
        <div className="relative size-4 mt-0.5 flex-shrink-0">
            {!faviconLoaded && <NotebookTabsIcon className="size-4 fill-current" />}
            <img
                src={faviconUrl}
                alt={`${domain} favicon`}
                className="size-4"
                onLoad={() => setFaviconLoaded(true)}
                onError={() => setFaviconError(true)}
                style={{ display: faviconLoaded ? 'block' : 'none' }}
            />
        </div>
    );
}

function DocumentIcon({ url, title }: { url: string; title: string }) {
    const urlLower = url.toLowerCase();
    const titleLower = title.toLowerCase();

    const isKnowledgeBase =
        url.includes('/knowledge/') ||
        url.startsWith('kb:') ||
        url.includes('/space/') ||
        titleLower.includes('knowledge base') ||
        titleLower.includes('internal doc') ||
        titleLower.includes('company doc') ||
        titleLower.includes('internal policy') ||
        titleLower.includes('company policy') ||
        titleLower.includes('internal guide') ||
        titleLower.includes('company guide') ||
        titleLower.includes('documentation') ||
        titleLower.includes('manual') ||
        titleLower.includes('handbook') ||
        (titleLower.includes('policy') && !url.includes('wikipedia')) ||
        (titleLower.includes('guideline') && !url.includes('wikipedia')) ||
        (titleLower.includes('procedure') && !url.includes('wikipedia'));

    if (urlLower.includes('.pdf') || titleLower.includes('pdf')) {
        return <FileIcon className="size-4 mt-0.5 flex-shrink-0 text-red-500 fill-current" />;
    }

    if (urlLower.includes('.doc') || urlLower.includes('.docx') || titleLower.includes('word')) {
        return <FileTextIcon className="size-4 mt-0.5 flex-shrink-0 text-blue-600 fill-current" />;
    }

    if (
        urlLower.includes('.xls') ||
        urlLower.includes('.xlsx') ||
        urlLower.includes('.csv') ||
        titleLower.includes('excel') ||
        titleLower.includes('spreadsheet')
    ) {
        return (
            <FileSpreadsheetIcon className="size-4 mt-0.5 flex-shrink-0 text-green-600 fill-current" />
        );
    }

    if (
        urlLower.includes('.ppt') ||
        urlLower.includes('.pptx') ||
        titleLower.includes('powerpoint') ||
        titleLower.includes('presentation')
    ) {
        return (
            <PresentationIcon className="size-4 mt-0.5 flex-shrink-0 text-orange-600 fill-current" />
        );
    }

    if (
        urlLower.includes('.jpg') ||
        urlLower.includes('.jpeg') ||
        urlLower.includes('.png') ||
        urlLower.includes('.gif') ||
        urlLower.includes('.svg') ||
        urlLower.includes('.webp') ||
        titleLower.includes('image') ||
        titleLower.includes('photo')
    ) {
        return <ImageIcon className="size-4 mt-0.5 flex-shrink-0 text-purple-600 fill-current" />;
    }

    if (
        urlLower.includes('.mp4') ||
        urlLower.includes('.avi') ||
        urlLower.includes('.mov') ||
        urlLower.includes('.webm') ||
        titleLower.includes('video')
    ) {
        return <VideoIcon className="size-4 mt-0.5 flex-shrink-0 text-red-600 fill-current" />;
    }

    if (isKnowledgeBase) {
        return (
            <BookOpenIcon className="size-4 mt-0.5 flex-shrink-0 text-emerald-600 fill-current" />
        );
    }

    return <FileIcon className="size-4 mt-0.5 flex-shrink-0 text-gray-500 fill-current" />;
}

export function Citation({ citation }: CitationProps) {
    const handleClick = () => {
        window.open(citation.url, '_blank', 'noopener,noreferrer');
    };

    const domain = (() => {
        try {
            return new URL(citation.url).hostname;
        } catch {
            return citation.url;
        }
    })();

    const isWebUrl = citation.url.startsWith('http://') || citation.url.startsWith('https://');
    const urlLower = citation.url.toLowerCase();
    const titleLower = citation.title.toLowerCase();

    const isDocument =
        !isWebUrl ||
        urlLower.includes('.pdf') ||
        urlLower.includes('.doc') ||
        urlLower.includes('.docx') ||
        urlLower.includes('.xls') ||
        urlLower.includes('.xlsx') ||
        urlLower.includes('.csv') ||
        urlLower.includes('.ppt') ||
        urlLower.includes('.pptx') ||
        urlLower.includes('.txt') ||
        urlLower.includes('.jpg') ||
        urlLower.includes('.jpeg') ||
        urlLower.includes('.png') ||
        urlLower.includes('.gif') ||
        urlLower.includes('.svg') ||
        urlLower.includes('.webp') ||
        urlLower.includes('.mp4') ||
        urlLower.includes('.avi') ||
        urlLower.includes('.mov') ||
        citation.url.includes('/knowledge/') ||
        citation.url.includes('/space/') ||
        citation.url.startsWith('kb:') ||
        titleLower.includes('knowledge base') ||
        titleLower.includes('internal doc') ||
        titleLower.includes('company doc') ||
        titleLower.includes('internal policy') ||
        titleLower.includes('company policy') ||
        titleLower.includes('internal guide') ||
        titleLower.includes('company guide') ||
        titleLower.includes('documentation') ||
        titleLower.includes('manual') ||
        titleLower.includes('guide') ||
        titleLower.includes('handbook') ||
        (titleLower.includes('policy') && !urlLower.includes('wikipedia')) ||
        (titleLower.includes('guideline') && !urlLower.includes('wikipedia')) ||
        (titleLower.includes('procedure') && !urlLower.includes('wikipedia'));

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span
                    onClick={handleClick}
                    className="inline-flex items-center justify-center min-w-[1.2rem] h-5 px-1 mx-0.5 text-xs font-medium text-blue-400  border rounded-full cursor-pointer transition-colors"
                >
                    {citation.id}
                </span>
            </TooltipTrigger>
            <TooltipContent sideOffset={10} className="max-w-xs p-3 space-y-2 bg-background border">
                <div className="flex items-start gap-2 text-primary">
                    {isDocument ? (
                        <DocumentIcon url={citation.url} title={citation.title} />
                    ) : (
                        <FaviconIcon domain={domain} />
                    )}
                    <div className="space-y-1">
                        <p className="text-sm font-medium leading-tight">{citation.title}</p>
                        <p className="text-xs ">{domain}</p>
                        {citation.content && (
                            <p className="text-xs  line-clamp-3">{citation.content}</p>
                        )}
                    </div>
                </div>
            </TooltipContent>
        </Tooltip>
    );
}
