'use client';

import rehypeExternalLinks from 'rehype-external-links';

import rehypeKatex from 'rehype-katex';
// import 'katex/dist/katex.min.css';

import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { twilight } from 'react-syntax-highlighter/dist/cjs/styles/prism';

import { MemoizedReactMarkdown } from '@/components/ui/markdown';

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

import {
    Table,
    TableBody,
    TableCaption,
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
            <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="relative w-full my-4"
            >
                <SyntaxHighlighter
                    {...props}
                    style={twilight}
                    wrapLongLines
                    language={match[1]}
                    PreTag="div"
                    className="!rounded-lg"
                    customStyle={{
                        fontSize: '0.875rem',
                    }}
                >
                    {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
            </motion.div>
        ) : (
            <code className={`${className} text-sm bg-zinc-900 py-0.5 px-1 rounded`} {...props}>
                {children}
            </code>
        );
    },
    table: ({ children }: any) => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <Table className="border">{children}</Table>
        </motion.div>
    ),
    thead: ({ children }: any) => <TableHeader className="bg-black">{children}</TableHeader>,
    tbody: ({ children }: any) => <TableBody>{children}</TableBody>,
    tr: ({ children }: any) => <TableRow>{children}</TableRow>,
    th: ({ children }: any) => <TableHead>{children}</TableHead>,
    td: ({ children }: any) => <TableCell>{children}</TableCell>,
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
            'prose-sm prose-neutral prose-a:text-accent-foreground/50 transition-all duration-200',
            'text-zinc-800 dark:text-zinc-300 w-full flex flex-col gap-4',
            className
        ),
        components: markdownComponents,
    };

    const content = containsLaTeX ? (
        <MemoizedReactMarkdown
            {...commonProps}
            rehypePlugins={[[rehypeExternalLinks, { target: '_blank' }], [rehypeKatex]]}
            remarkPlugins={[remarkGfm, remarkMath]}
        >
            {processedData}
        </MemoizedReactMarkdown>
    ) : (
        <MemoizedReactMarkdown
            {...commonProps}
            rehypePlugins={[[rehypeExternalLinks, { target: '_blank' }]]}
            remarkPlugins={[remarkGfm]}
        >
            {message}
        </MemoizedReactMarkdown>
    );

    return (
        <motion.div
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="w-full max-w-2xl first-of-type:mt-10"
        >
            <motion.div
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col items-start justify-start gap-2 w-full h-full"
            >
                {content}
            </motion.div>
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
