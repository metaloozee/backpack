'use client';

import React from 'react';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark, oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

import { MemoizedReactMarkdown } from '@/components/ui/markdown';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { removeContemplateContent } from '@/lib/utils/message';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { BrainIcon } from 'lucide-react';
import { CopyIcon, CheckIcon, CodeIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

const extractDomain = (url: string): string => {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch {
        return url;
    }
};

const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const [isCopied, setIsCopied] = React.useState(false);

    const handleCopy = () => {
        const code = String(children).replace(/\n$/, '');
        navigator.clipboard.writeText(code);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return !inline && match ? (
        <div className="relative w-full max-w-2xl">
            <div className="flex items-center justify-between bg-neutral-900/50 px-4 py-2.5 rounded-t-lg border-x border-t border-border">
                <div className="flex items-center gap-1.5">
                    <CodeIcon className="size-3 text-muted-foreground" />
                    <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                        {match[1]}
                    </div>
                </div>
                <div className="relative">
                    <Button
                        variant="ghost"
                        size={'icon'}
                        className="h-6 w-6 bg-background/60 hover:bg-muted border border-border/50 shadow-xs transition-all duration-200 hover:scale-105 relative overflow-hidden"
                        onClick={handleCopy}
                        title={isCopied ? 'Copied!' : 'Copy code'}
                    >
                        {isCopied ? (
                            <CheckIcon className="text-muted-foreground size-2" />
                        ) : (
                            <CopyIcon className="text-muted-foreground size-2" />
                        )}
                    </Button>
                    {isCopied && (
                        <div className="absolute right-0 top-full mt-1 text-xs bg-background/90 border border-border/50 shadow-xs rounded px-2 py-1 pointer-events-none z-20">
                            Copied!
                        </div>
                    )}
                </div>
            </div>
            <SyntaxHighlighter
                {...props}
                style={oneDark}
                wrapLongLines
                showLineNumbers
                language={match[1]}
                PreTag="div"
                className="rounded-t-none! rounded-b-lg! m-0!"
                customStyle={{
                    background: 'hsl(var(--background))',
                    padding: '1.25rem 1rem',
                    border: '1px solid hsl(var(--border))',
                    borderTop: 'none',
                }}
            >
                {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
        </div>
    ) : (
        <code
            className={cn('text-sm bg-muted px-1.5 py-0.5 rounded-md font-mono', className)}
            {...props}
        >
            {children}
        </code>
    );
};

const markdownComponents = {
    code: CodeBlock,
    table: ({ children }: any) => <Table className="border my-4">{children}</Table>,
    thead: ({ children }: any) => <TableHeader className="bg-muted/50">{children}</TableHeader>,
    tbody: ({ children }: any) => <TableBody>{children}</TableBody>,
    tr: ({ children }: any) => <TableRow className="hover:bg-muted/30">{children}</TableRow>,
    th: ({ children }: any) => <TableHead className="font-semibold">{children}</TableHead>,
    td: ({ children }: any) => <TableCell>{children}</TableCell>,
    p: ({ children }: any) => <p className="mb-4 leading-7 text-neutral-300">{children}</p>,
    h1: ({ children }: any) => <h1 className="text-3xl font-bold mt-6 mb-4">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-2xl font-semibold mt-5 mb-3">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-xl font-semibold mt-4 mb-2">{children}</h3>,
    ul: ({ children }: any) => (
        <ul className="list-disc marker:text-muted-foreground list-outside pl-6 mb-4">
            {children}
        </ul>
    ),
    ol: ({ children }: any) => <ol className="list-decimal list-outside pl-6 mb-4">{children}</ol>,
    li: ({ children }: any) => <li className="mb-1 text-neutral-300">{children}</li>,
    blockquote: ({ children }: any) => (
        <blockquote className="border-l-4 border-muted pl-4 italic my-4">{children}</blockquote>
    ),
    a: ({ children, href }: any) => (
        <Link href={href} target="_blank" className="text-xs text-muted-foreground hover:underline">
            {href ? extractDomain(href) : children}
        </Link>
    ),
    strong: ({ children }: any) => (
        <strong className="font-bold text-neutral-100">{children}</strong>
    ),
    inlineMath: ({ value }: { value: string }) => <span className="math math-inline">{value}</span>,
    math: ({ value }: { value: string }) => <div className="math math-display">{value}</div>,
};

interface BotMessageProps {
    message: string;
    className?: string;
}

export function BotMessage({ message, className }: BotMessageProps) {
    // const cleanedMessage = removeContemplateContent(message || '');
    const containsLaTeX = /\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)/.test(message);
    const processedData = preprocessLaTeX(message);

    return (
        <div className={cn('group/message relative flex w-full items-start gap-3 pt-4', className)}>
            <div className="flex-1 space-y-2 ">
                <div className="prose prose-neutral dark:prose-invert max-w-none break-words">
                    <MemoizedReactMarkdown
                        className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 max-w-none"
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[
                            rehypeKatex,
                            rehypeRaw,
                            [
                                rehypeExternalLinks,
                                {
                                    target: '_blank',
                                    rel: ['nofollow', 'noopener', 'noreferrer'],
                                },
                            ],
                        ]}
                        components={markdownComponents}
                    >
                        {processedData}
                    </MemoizedReactMarkdown>
                </div>
            </div>
        </div>
    );
}

const preprocessLaTeX = (content: string) => {
    const blockProcessedContent = content.replace(
        /\\\[([\s\S]*?)\\\]/g,
        (_, equation) => `$$${equation}$$`
    );
    const inlineProcessedContent = blockProcessedContent.replace(
        /\\\(([\s\S]*?)\\\)/g,
        (_, equation) => `$${equation}$`
    );
    return inlineProcessedContent;
};
