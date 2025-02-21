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
                        fontSize: '0.9rem',
                        background: 'hsl(var(--background))',
                        padding: '1.5rem',
                        border: '1px solid hsl(var(--border))',
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
    },
    table: ({ children }: any) => <Table className="border my-4">{children}</Table>,
    thead: ({ children }: any) => <TableHeader className="bg-muted/50">{children}</TableHeader>,
    tbody: ({ children }: any) => <TableBody>{children}</TableBody>,
    tr: ({ children }: any) => <TableRow className="hover:bg-muted/30">{children}</TableRow>,
    th: ({ children }: any) => <TableHead className="font-semibold">{children}</TableHead>,
    td: ({ children }: any) => <TableCell>{children}</TableCell>,
    p: ({ children }: any) => <p className="mb-4 leading-7 text-zinc-300">{children}</p>,
    h1: ({ children }: any) => <h1 className="text-3xl font-bold mt-6 mb-4">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-2xl font-semibold mt-5 mb-3">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-xl font-semibold mt-4 mb-2">{children}</h3>,
    ul: ({ children }: any) => <ul className="list-disc list-outside pl-6 mb-4">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal list-outside pl-6 mb-4">{children}</ol>,
    li: ({ children }: any) => <li className="mb-1 text-zinc-300">{children}</li>,
    blockquote: ({ children }: any) => (
        <blockquote className="border-l-4 border-muted pl-4 italic my-4">{children}</blockquote>
    ),
    a: ({ children, href }: any) => (
        <Link href={href} className="text-primary hover:underline" target="_blank">
            {children}
        </Link>
    ),
    inlineMath: ({ value }: { value: string }) => <span className="math math-inline">{value}</span>,
    math: ({ value }: { value: string }) => <div className="math math-display">{value}</div>,
};

interface BotMessageProps {
    message: string;
    className?: string;
}

export function BotMessage({ message, className }: BotMessageProps) {
    const cleanedMessage = removeContemplateContent(message || '');
    const containsLaTeX = /\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)/.test(cleanedMessage);
    const processedData = preprocessLaTeX(cleanedMessage);

    const commonProps = {
        className: cn(
            'prose prose-neutral dark:prose-invert max-w-none',
            'prose-p:leading-7 prose-pre:p-0',
            'prose-headings:font-semibold',
            'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
            'prose-strong:font-semibold prose-strong:text-foreground',
            className
        ),
    };

    if (containsLaTeX) {
        return (
            <MemoizedReactMarkdown
                {...commonProps}
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[
                    [rehypeExternalLinks, { target: '_blank' }],
                    rehypeRaw,
                    rehypeKatex,
                ]}
                components={markdownComponents}
            >
                {processedData}
            </MemoizedReactMarkdown>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            className="w-full flex justify-start items-start"
        >
            <Avatar className="mr-2">
                <AvatarFallback className="bg-zinc-900">
                    <BrainIcon className="size-4 text-zinc-300" />
                </AvatarFallback>
            </Avatar>
            <MemoizedReactMarkdown
                {...commonProps}
                components={markdownComponents}
                rehypePlugins={[[rehypeExternalLinks, { target: '_blank' }], rehypeRaw]}
                remarkPlugins={[remarkGfm]}
            >
                {processedData}
            </MemoizedReactMarkdown>
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
