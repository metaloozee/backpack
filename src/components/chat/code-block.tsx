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
        navigator.clipboard
            .writeText(code)
            .then(() => {
                setCopied(true);
                toast.success('Copied to clipboard');
                setTimeout(() => setCopied(false), 1500);
            })
            .catch(() => {
                toast.error('Failed to copy');
            });
    }, [code]);

    return (
        <div className="relative group w-full max-w-2xl rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-950 text-neutral-50 overflow-visible">
            {/* {language !== 'text' && (
                <span className="pointer-events-none select-none rounded px-1.5 text-[10px] font-medium uppercase tracking-wider text-neutral-400/90 ring-1 ring-inset ring-neutral-700/50">
                    {language}
                </span>
            )} */}
            <SyntaxHighlighter
                language={language}
                style={vscDarkPlus}
                wrapLongLines
                customStyle={{
                    margin: 0,
                    padding: '1rem',
                    fontSize: '0.875rem',
                    lineHeight: '1.5',
                    background: 'transparent',
                    borderRadius: '0.5rem',
                    width: '100%',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    overflowWrap: 'anywhere',
                    wordWrap: 'break-word',
                }}
            >
                {code}
            </SyntaxHighlighter>

            <TooltipProvider delayDuration={100}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={handleCopy}
                        >
                            {copied ? (
                                <CheckIcon className="size-4" />
                            ) : (
                                <CopyIcon className="size-4" />
                            )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">{copied ? 'Copied' : 'Copy code'}</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}
