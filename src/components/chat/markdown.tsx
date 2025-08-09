import Link from 'next/link';
import React, { memo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from '@/components/chat/code-block';
import { useCitations } from '@/lib/hooks/use-citations';
import { Citation } from './citation';
import { References } from './references';
import { TooltipProvider } from '@/components/ui/tooltip';

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
                className="whitespace-nowrap font-mono rounded-md px-1.5 py-0 bg-neutral-400 dark:bg-neutral-800 border border-neutral-600 text-neutral-800 dark:text-neutral-100"
                {...props}
            >
                {children}
            </code>
        );
    },
    pre: ({ children }) => (
        <div className="not-prose my-4 text-sm max-w-2xl overflow-visible whitespace-pre-wrap break-words">
            {children}
        </div>
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
                className="border-l-4 border-neutral-300 dark:border-neutral-700 pl-4 italic my-4 text-neutral-600 dark:text-neutral-400"
                {...props}
            >
                {children}
            </blockquote>
        );
    },
    hr: ({ ...props }) => (
        <hr className="my-6 border-t border-neutral-200 dark:border-neutral-700" {...props} />
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
            <thead className="bg-neutral-50 dark:bg-neutral-800" {...props}>
                {children}
            </thead>
        );
    },
    th: ({ node, children, ...props }) => {
        return (
            <th
                className="py-2 px-3 font-semibold border-b border-neutral-200 dark:border-neutral-700"
                {...props}
            >
                {children}
            </th>
        );
    },
    td: ({ node, children, ...props }) => {
        return (
            <td
                className="py-2 px-3 border-b border-neutral-200 dark:border-neutral-700"
                {...props}
            >
                {children}
            </td>
        );
    },
    img: ({ node, ...props }) => <img className="rounded-lg max-w-full" {...props} />,
};

const remarkPlugins = [remarkGfm, remarkMath];
const rehypePlugins = [rehypeKatex];

const NonMemoizedMarkdown = ({ children }: { children: string }) => {
    const { processedContent, citations } = useCitations(children);

    const renderTextWithCitations = (text: string | React.ReactNode): React.ReactNode => {
        if (typeof text !== 'string') {
            return text;
        }

        const citationRegex = /\[(\d+)\]/g;
        const parts: React.ReactNode[] = [];
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

        return parts.length > 1 ? parts : text;
    };

    const citationAwareComponents: Partial<Components> = {
        ...components,
        p: ({ node, children, ...props }) => {
            const processChildren = (children: React.ReactNode): React.ReactNode => {
                if (Array.isArray(children)) {
                    return children.map((child, index) =>
                        typeof child === 'string' ? renderTextWithCitations(child) : child
                    );
                }
                return typeof children === 'string' ? renderTextWithCitations(children) : children;
            };

            return <p {...props}>{processChildren(children)}</p>;
        },
        // Also handle text in other elements
        h1: ({ node, children, ...props }) => (
            <h1 className="text-3xl font-semibold mt-6 mb-2" {...props}>
                {typeof children === 'string' ? renderTextWithCitations(children) : children}
            </h1>
        ),
        h2: ({ node, children, ...props }) => (
            <h2 className="text-2xl font-semibold mt-6 mb-2" {...props}>
                {typeof children === 'string' ? renderTextWithCitations(children) : children}
            </h2>
        ),
        h3: ({ node, children, ...props }) => (
            <h3 className="text-xl font-semibold mt-6 mb-2" {...props}>
                {typeof children === 'string' ? renderTextWithCitations(children) : children}
            </h3>
        ),
        h4: ({ node, children, ...props }) => (
            <h4 className="text-lg font-semibold mt-6 mb-2" {...props}>
                {typeof children === 'string' ? renderTextWithCitations(children) : children}
            </h4>
        ),
        h5: ({ node, children, ...props }) => (
            <h5 className="text-base font-semibold mt-6 mb-2" {...props}>
                {typeof children === 'string' ? renderTextWithCitations(children) : children}
            </h5>
        ),
        h6: ({ node, children, ...props }) => (
            <h6 className="text-sm font-semibold mt-6 mb-2" {...props}>
                {typeof children === 'string' ? renderTextWithCitations(children) : children}
            </h6>
        ),
        li: ({ node, children, ...props }) => (
            <li className="py-1" {...props}>
                {typeof children === 'string' ? renderTextWithCitations(children) : children}
            </li>
        ),
    };

    return (
        <TooltipProvider delayDuration={0}>
            <div>
                <ReactMarkdown
                    remarkPlugins={remarkPlugins}
                    rehypePlugins={rehypePlugins}
                    components={citationAwareComponents}
                    className="text-sm sm:text-base leading-7 space-y-4"
                >
                    {processedContent}
                </ReactMarkdown>
                {/* <References citations={citations} /> */}
            </div>
        </TooltipProvider>
    );
};

export const Markdown = memo(
    NonMemoizedMarkdown,
    (prevProps, nextProps) => prevProps.children === nextProps.children
);
