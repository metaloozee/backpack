import Link from 'next/link';
import React, { memo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from '@/components/chat/code-block';

import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const components: Partial<Components> = {
    code: ({ node, className, children, ...props }) => {
        const match = /language-(\w+)/.exec(className || '');
        return match ? (
            <CodeBlock className={className}>{children}</CodeBlock>
        ) : (
            <code
                className="whitespace-nowrap font-mono rounded-md px-1.5 py-0 bg-zinc-400 dark:bg-zinc-800 border border-zinc-600 text-zinc-800 dark:text-zinc-100"
                {...props}
            >
                {children}
            </code>
        );
    },
    pre: ({ children }) => (
        <div className="not-prose my-4 text-sm overflow-hidden max-w-full">{children}</div>
    ),
    ol: ({ node, children, ...props }) => {
        return (
            <ol className="list-decimal list-outside ml-4" {...props}>
                {children}
            </ol>
        );
    },
    li: ({ node, children, ...props }) => {
        return (
            <li className="py-1" {...props}>
                {children}
            </li>
        );
    },
    ul: ({ node, children, ...props }) => {
        return (
            <ul className="list-disc list-outside ml-4" {...props}>
                {children}
            </ul>
        );
    },
    strong: ({ node, children, ...props }) => {
        return (
            <span className="font-semibold" {...props}>
                {children}
            </span>
        );
    },
    a: ({ node, children, ...props }) => {
        return (
            // @ts-expect-error
            <Link
                className="text-blue-500 hover:underline"
                target="_blank"
                rel="noreferrer"
                {...props}
            >
                {children}
            </Link>
        );
    },
    h1: ({ node, children, ...props }) => {
        return (
            <h1 className="text-3xl font-semibold mt-6 mb-2" {...props}>
                {children}
            </h1>
        );
    },
    h2: ({ node, children, ...props }) => {
        return (
            <h2 className="text-2xl font-semibold mt-6 mb-2" {...props}>
                {children}
            </h2>
        );
    },
    h3: ({ node, children, ...props }) => {
        return (
            <h3 className="text-xl font-semibold mt-6 mb-2" {...props}>
                {children}
            </h3>
        );
    },
    h4: ({ node, children, ...props }) => {
        return (
            <h4 className="text-lg font-semibold mt-6 mb-2" {...props}>
                {children}
            </h4>
        );
    },
    h5: ({ node, children, ...props }) => {
        return (
            <h5 className="text-base font-semibold mt-6 mb-2" {...props}>
                {children}
            </h5>
        );
    },
    h6: ({ node, children, ...props }) => {
        return (
            <h6 className="text-sm font-semibold mt-6 mb-2" {...props}>
                {children}
            </h6>
        );
    },
    blockquote: ({ node, children, ...props }) => {
        return (
            <blockquote
                className="border-l-4 border-zinc-300 dark:border-zinc-700 pl-4 italic my-4 text-zinc-600 dark:text-zinc-400"
                {...props}
            >
                {children}
            </blockquote>
        );
    },
    hr: ({ ...props }) => (
        <hr className="my-6 border-t border-zinc-200 dark:border-zinc-700" {...props} />
    ),
    table: ({ node, children, ...props }) => {
        return (
            <div className="my-6 overflow-x-auto">
                <table className="w-full text-left border-collapse" {...props}>
                    {children}
                </table>
            </div>
        );
    },
    thead: ({ node, children, ...props }) => {
        return (
            <thead className="bg-zinc-50 dark:bg-zinc-800" {...props}>
                {children}
            </thead>
        );
    },
    th: ({ node, children, ...props }) => {
        return (
            <th
                className="py-2 px-3 font-semibold border-b border-zinc-200 dark:border-zinc-700"
                {...props}
            >
                {children}
            </th>
        );
    },
    td: ({ node, children, ...props }) => {
        return (
            <td className="py-2 px-3 border-b border-zinc-200 dark:border-zinc-700" {...props}>
                {children}
            </td>
        );
    },
    img: ({ node, ...props }) => <img className="rounded-lg max-w-full" {...props} />,
};

const remarkPlugins = [remarkGfm, remarkMath];
const rehypePlugins = [rehypeKatex];

const NonMemoizedMarkdown = ({ children }: { children: string }) => {
    return (
        <ReactMarkdown
            remarkPlugins={remarkPlugins}
            rehypePlugins={rehypePlugins}
            components={components}
            className="text-sm sm:text-base leading-7 space-y-4"
        >
            {children}
        </ReactMarkdown>
    );
};

export const Markdown = memo(
    NonMemoizedMarkdown,
    (prevProps, nextProps) => prevProps.children === nextProps.children
);
