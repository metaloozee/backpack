import Image from "next/image";
import Link from "next/link";
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { memo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { CodeBlock } from "@/components/chat/code-block";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useCitations } from "@/lib/hooks/use-citations";
import { cn } from "@/lib/utils";
import { Citation } from "./citation";
import "katex/dist/katex.min.css";

const LANGUAGE_REGEX = /language-(\w+)/;
const CITATION_REGEX = /\[(\d+)\]/g;

const headingClassNames = {
	h1: "mt-6 mb-2 font-semibold text-3xl",
	h2: "mt-6 mb-2 font-semibold text-2xl",
	h3: "mt-6 mb-2 font-semibold text-xl",
	h4: "mt-6 mb-2 font-semibold text-lg",
	h5: "mt-6 mb-2 font-semibold text-base",
	h6: "mt-6 mb-2 font-semibold text-sm",
} as const;

const listItemClassName = "py-1" as const;

type MarkdownComponentProps<T extends ElementType> = ComponentPropsWithoutRef<T> & {
	node?: unknown;
	children?: ReactNode;
};

const makeComponent = <T extends ElementType>(
	Tag: T,
	defaultProps?: Partial<ComponentPropsWithoutRef<T>>,
	transformChildren?: (children: ReactNode) => ReactNode
) => {
	return ({ node: _node, children, className, ...rest }: MarkdownComponentProps<T>) => {
		const content = transformChildren === undefined ? children : transformChildren(children);

		return (
			// @ts-expect-error Generic component props spreading is complex but works at runtime
			<Tag
				{...defaultProps}
				{...rest}
				className={cn((defaultProps as { className?: string } | undefined)?.className, className)}
			>
				{content}
			</Tag>
		);
	};
};

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
	li: makeComponent("li", { className: listItemClassName }),
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
			<Link className="text-blue-500 hover:underline" rel="noopener noreferrer" target="_blank" {...props}>
				{children}
			</Link>
		);
	},
	h1: makeComponent("h1", { className: headingClassNames.h1 }),
	h2: makeComponent("h2", { className: headingClassNames.h2 }),
	h3: makeComponent("h3", { className: headingClassNames.h3 }),
	h4: makeComponent("h4", { className: headingClassNames.h4 }),
	h5: makeComponent("h5", { className: headingClassNames.h5 }),
	h6: makeComponent("h6", { className: headingClassNames.h6 }),
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

	const renderTextWithCitations = (text: string | ReactNode): ReactNode => {
		if (typeof text !== "string") {
			return text;
		}

		const parts: ReactNode[] = [];
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

	const renderChildrenWithCitations = (nodeChildren: ReactNode): ReactNode => {
		if (nodeChildren === null || nodeChildren === undefined || typeof nodeChildren === "boolean") {
			return nodeChildren;
		}

		if (typeof nodeChildren === "string") {
			return renderTextWithCitations(nodeChildren);
		}

		if (Array.isArray(nodeChildren)) {
			return nodeChildren.map((child) => renderChildrenWithCitations(child));
		}

		return nodeChildren;
	};

	const makeCitationComponent = <T extends ElementType>(
		Tag: T,
		defaultProps?: Partial<ComponentPropsWithoutRef<T>>
	) => makeComponent(Tag, defaultProps, renderChildrenWithCitations);

	const citationAwareComponents: Partial<Components> = {
		...components,
		p: makeCitationComponent("p"),
		h1: makeCitationComponent("h1", { className: headingClassNames.h1 }),
		h2: makeCitationComponent("h2", { className: headingClassNames.h2 }),
		h3: makeCitationComponent("h3", { className: headingClassNames.h3 }),
		h4: makeCitationComponent("h4", { className: headingClassNames.h4 }),
		h5: makeCitationComponent("h5", { className: headingClassNames.h5 }),
		h6: makeCitationComponent("h6", { className: headingClassNames.h6 }),
		li: makeCitationComponent("li", { className: listItemClassName }),
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
