import Image from "next/image";
import Link from "next/link";
import type React from "react";
import { memo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { CodeBlock } from "@/components/chat/code-block";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useCitations } from "@/lib/hooks/use-citations";
import { Citation } from "./citation";
import "katex/dist/katex.min.css";

// Move regex to top-level scope for performance
const LANGUAGE_REGEX = /language-(\w+)/;
const CITATION_REGEX = /\[(\d+)\]/g;

const components: Partial<Components> = {
	code: ({ node, className, children, ...props }) => {
		const match = LANGUAGE_REGEX.exec(className || "");
		return match ? (
			<CodeBlock className={className}>{children}</CodeBlock>
		) : (
			<code
				className="whitespace-nowrap rounded-md border border-neutral-600 bg-neutral-400 px-1.5 py-0 font-mono text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
				{...props}
			>
				{children}
			</code>
		);
	},
	pre: ({ children }) => (
		<div className="not-prose my-4 max-w-2xl overflow-visible whitespace-pre-wrap break-words text-sm">
			{children}
		</div>
	),
	ol: ({ node, children, ...props }) => {
		return (
			<ol className="ml-4 list-outside list-decimal" {...props}>
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
			<ul className="ml-4 list-outside list-disc" {...props}>
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
			<Link className="text-blue-500 hover:underline" rel="noreferrer" target="_blank" {...props}>
				{children}
			</Link>
		);
	},
	h1: ({ node, children, ...props }) => {
		return (
			<h1 className="mt-6 mb-2 font-semibold text-3xl" {...props}>
				{children}
			</h1>
		);
	},
	h2: ({ node, children, ...props }) => {
		return (
			<h2 className="mt-6 mb-2 font-semibold text-2xl" {...props}>
				{children}
			</h2>
		);
	},
	h3: ({ node, children, ...props }) => {
		return (
			<h3 className="mt-6 mb-2 font-semibold text-xl" {...props}>
				{children}
			</h3>
		);
	},
	h4: ({ node, children, ...props }) => {
		return (
			<h4 className="mt-6 mb-2 font-semibold text-lg" {...props}>
				{children}
			</h4>
		);
	},
	h5: ({ node, children, ...props }) => {
		return (
			<h5 className="mt-6 mb-2 font-semibold text-base" {...props}>
				{children}
			</h5>
		);
	},
	h6: ({ node, children, ...props }) => {
		return (
			<h6 className="mt-6 mb-2 font-semibold text-sm" {...props}>
				{children}
			</h6>
		);
	},
	blockquote: ({ node, children, ...props }) => {
		return (
			<blockquote
				className="my-4 border-neutral-300 border-l-4 pl-4 text-neutral-600 italic dark:border-neutral-700 dark:text-neutral-400"
				{...props}
			>
				{children}
			</blockquote>
		);
	},
	hr: ({ ...props }) => <hr className="my-6 border-neutral-200 border-t dark:border-neutral-700" {...props} />,
	table: ({ node, children, ...props }) => {
		return (
			<div className="my-6 overflow-x-auto">
				<table className="w-full border-collapse text-left" {...props}>
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
			<th className="border-neutral-200 border-b px-3 py-2 font-semibold dark:border-neutral-700" {...props}>
				{children}
			</th>
		);
	},
	td: ({ node, children, ...props }) => {
		return (
			<td className="border-neutral-200 border-b px-3 py-2 dark:border-neutral-700" {...props}>
				{children}
			</td>
		);
	},
	img: ({ node, alt, src, width, height, ...props }) => {
		let imageWidth = 600;
		if (typeof width === "number") {
			imageWidth = width;
		} else if (typeof width === "string") {
			imageWidth = Number.parseInt(width, 10) || 600;
		}

		let imageHeight = 400;
		if (typeof height === "number") {
			imageHeight = height;
		} else if (typeof height === "string") {
			imageHeight = Number.parseInt(height, 10) || 400;
		}

		const imageSrc = typeof src === "string" ? src : "";
		const imageAlt = typeof alt === "string" ? alt : "";

		return (
			<Image
				alt={imageAlt}
				className="max-w-full rounded-lg"
				height={imageHeight}
				src={imageSrc}
				width={imageWidth}
				{...props}
			/>
		);
	},
};

const remarkPlugins = [remarkGfm, remarkMath];
const rehypePlugins = [rehypeKatex];

const NonMemoizedMarkdown = ({ children }: { children: string }) => {
	const { processedContent, citations } = useCitations(children);

	const renderTextWithCitations = (text: string | React.ReactNode): React.ReactNode => {
		if (typeof text !== "string") {
			return text;
		}

		const parts: React.ReactNode[] = [];
		let lastIndex = 0;
		let match: RegExpExecArray | null;

		// Reset regex lastIndex to avoid issues with global regex
		CITATION_REGEX.lastIndex = 0;
		match = CITATION_REGEX.exec(text);
		while (match !== null) {
			if (match.index > lastIndex) {
				parts.push(text.slice(lastIndex, match.index));
			}

			const citationId = Number.parseInt(match[1], 10);
			const citation = citations.find((c) => c.id === citationId);

			if (citation) {
				parts.push(<Citation citation={citation} key={`citation-${citation.id}-${match.index}`} />);
			} else {
				parts.push(match[0]);
			}

			lastIndex = match.index + match[0].length;
			match = CITATION_REGEX.exec(text);
		}

		if (lastIndex < text.length) {
			parts.push(text.slice(lastIndex));
		}

		return parts.length > 1 ? parts : text;
	};

	const citationAwareComponents: Partial<Components> = {
		...components,
		p: ({ node, children: pChildren, ...props }) => {
			const processChildren = (childrenToProcess: React.ReactNode): React.ReactNode => {
				if (Array.isArray(childrenToProcess)) {
					return childrenToProcess.map((child) =>
						typeof child === "string" ? renderTextWithCitations(child) : child
					);
				}
				return typeof childrenToProcess === "string"
					? renderTextWithCitations(childrenToProcess)
					: childrenToProcess;
			};

			return <p {...props}>{processChildren(pChildren)}</p>;
		},
		// Also handle text in other elements
		h1: ({ node, children: h1Children, ...props }) => (
			<h1 className="mt-6 mb-2 font-semibold text-3xl" {...props}>
				{typeof h1Children === "string" ? renderTextWithCitations(h1Children) : h1Children}
			</h1>
		),
		h2: ({ node, children: h2Children, ...props }) => (
			<h2 className="mt-6 mb-2 font-semibold text-2xl" {...props}>
				{typeof h2Children === "string" ? renderTextWithCitations(h2Children) : h2Children}
			</h2>
		),
		h3: ({ node, children: h3Children, ...props }) => (
			<h3 className="mt-6 mb-2 font-semibold text-xl" {...props}>
				{typeof h3Children === "string" ? renderTextWithCitations(h3Children) : h3Children}
			</h3>
		),
		h4: ({ node, children: h4Children, ...props }) => (
			<h4 className="mt-6 mb-2 font-semibold text-lg" {...props}>
				{typeof h4Children === "string" ? renderTextWithCitations(h4Children) : h4Children}
			</h4>
		),
		h5: ({ node, children: h5Children, ...props }) => (
			<h5 className="mt-6 mb-2 font-semibold text-base" {...props}>
				{typeof h5Children === "string" ? renderTextWithCitations(h5Children) : h5Children}
			</h5>
		),
		h6: ({ node, children: h6Children, ...props }) => (
			<h6 className="mt-6 mb-2 font-semibold text-sm" {...props}>
				{typeof h6Children === "string" ? renderTextWithCitations(h6Children) : h6Children}
			</h6>
		),
		li: ({ node, children: liChildren, ...props }) => (
			<li className="py-1" {...props}>
				{typeof liChildren === "string" ? renderTextWithCitations(liChildren) : liChildren}
			</li>
		),
	};

	return (
		<TooltipProvider delayDuration={0}>
			<div>
				<ReactMarkdown
					className="space-y-4 text-sm leading-7 sm:text-base"
					components={citationAwareComponents}
					rehypePlugins={rehypePlugins}
					remarkPlugins={remarkPlugins}
				>
					{processedContent}
				</ReactMarkdown>
				{/* <References citations={citations} /> */}
			</div>
		</TooltipProvider>
	);
};

export const Markdown = memo(NonMemoizedMarkdown, (prevProps, nextProps) => prevProps.children === nextProps.children);
