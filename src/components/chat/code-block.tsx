'use client';

import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CopyIcon, CheckIcon } from 'lucide-react';
import { toast } from 'sonner';

export function CodeBlock({
    className,
    children,
}: {
    className?: string;
    children?: React.ReactNode;
}) {
    const match = /language-(\w+)/.exec(className || '');
    const language = match?.[1] || 'text';
    const code = String(children).replace(/\n$/, '');

    const [copied, setCopied] = React.useState(false);

    const handleCopy = React.useCallback(() => {
        if (!navigator?.clipboard) return;
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            toast('Copied to clipboard');
            setTimeout(() => setCopied(false), 2000);
        });
    }, [code]);

    return (
        <div className="relative group">
            <SyntaxHighlighter
                language={language}
                style={vscDarkPlus}
                wrapLongLines={true}
                customStyle={{
                    margin: 0,
                    padding: '1rem',
                    fontSize: '0.875rem',
                    lineHeight: '1.5',
                    overflowX: 'auto',
                    borderRadius: '0.5rem',
                }}
            >
                {code}
            </SyntaxHighlighter>

            <TooltipProvider delayDuration={100}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={handleCopy}
                        >
                            {copied ? (
                                <CheckIcon className="size-4" />
                            ) : (
                                <CopyIcon className="size-4" />
                            )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">Copy</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}
