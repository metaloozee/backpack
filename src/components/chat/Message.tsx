'use client';

import rehypeExternalLinks from 'rehype-external-links';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { twilight } from 'react-syntax-highlighter/dist/cjs/styles/prism';

import { MemoizedReactMarkdown } from '@/components/ui/markdown';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

// Separate the markdown components configuration
const markdownComponents = {
    code: ({ node, inline, className, children, ...props }: any) => {
        const match = /language-(\w+)/.exec(className || '');
        return !inline && match ? (
            <div className="relative w-full my-4">
                <SyntaxHighlighter
                    {...props}
                    style={twilight}
                    wrapLongLines
                    language={match[1]}
                    PreTag="div"
                    className="!rounded-lg"
                    customStyle={{
                        fontSize: '0.875rem',
                        background: 'hsl(var(--background))',
                        padding: '1.5rem',
                    }}
                >
                    {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
            </div>
        ) : (
            <code className={cn('text-sm bg-zinc-900 py-0.5 px-1 rounded', className)} {...props}>
                {children}
            </code>
        );
    },
    table: ({ children }: any) => <Table className="border">{children}</Table>,
    thead: ({ children }: any) => <TableHeader className="bg-black">{children}</TableHeader>,
    tbody: ({ children }: any) => <TableBody>{children}</TableBody>,
    tr: ({ children }: any) => <TableRow>{children}</TableRow>,
    th: ({ children }: any) => <TableHead>{children}</TableHead>,
    td: ({ children }: any) => <TableCell>{children}</TableCell>,

    inlineMath: ({ value }: { value: string }) => <span className="math math-inline">{value}</span>,
    math: ({ value }: { value: string }) => <div className="math math-display">{value}</div>,
};

interface BotMessageProps {
    message: string;
    className?: string;
}

export function BotMessage({ message, className }: BotMessageProps) {
    const containsLaTeX = /\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)/.test(message || '');
    const processedData = preprocessLaTeX(message || '');

    const commonProps = {
        className: cn(
            'prose prose-neutral dark:prose-invert max-w-none',
            'prose-p:leading-relaxed prose-pre:p-0',
            'prose-code:px-1 prose-code:font-normal',
            'prose-code:before:content-none prose-code:after:content-none',
            'break-words leading-7 ',
            className
        ),
        components: markdownComponents,
    };

    const content = containsLaTeX ? (
        <MemoizedReactMarkdown
            {...commonProps}
            rehypePlugins={[[rehypeExternalLinks, { target: '_blank' }], rehypeKatex, rehypeRaw]}
            remarkPlugins={[remarkGfm, remarkMath]}
        >
            {processedData}
        </MemoizedReactMarkdown>
    ) : (
        <MemoizedReactMarkdown
            {...commonProps}
            rehypePlugins={[[rehypeExternalLinks, { target: '_blank' }], rehypeRaw]}
            remarkPlugins={[remarkGfm]}
        >
            {message}
        </MemoizedReactMarkdown>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 10, stiffness: 400 }}
            className="flex-1 p-2 break-words w-full"
        >
            {content}
        </motion.div>
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
