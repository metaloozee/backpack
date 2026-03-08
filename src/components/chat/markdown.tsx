import Image from "next/image";
import Link from "next/link";
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { memo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import {
	CodeBlock,
	CodeBlockCopyButton,
	CodeBlockDownloadButton,
} from "@/components/chat/code-block";
import { DownloadableTable } from "@/components/chat/downloadable-table";
import {
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import "katex/dist/katex.min.css";

const LANGUAGE_REGEX = /language-(\w+)/;
const TRAILING_NEWLINE_REGEX = /\n$/;

const headingClassNames = {
	h1: "mt-6 mb-2 font-semibold text-3xl",
	h2: "mt-6 mb-2 font-semibold text-2xl",
	h3: "mt-6 mb-2 font-semibold text-xl",
	h4: "mt-6 mb-2 font-semibold text-lg",
	h5: "mt-6 mb-2 font-semibold text-base",
	h6: "mt-6 mb-2 font-semibold text-sm",
} as const;

const listItemClassName = "py-1" as const;

type MarkdownComponentProps<T extends ElementType> =
	ComponentPropsWithoutRef<T> & {
		node?: unknown;
		children?: ReactNode;
	};

const makeComponent = <T extends ElementType>(
	Tag: T,
	defaultProps?: Partial<ComponentPropsWithoutRef<T>>,
	transformChildren?: (children: ReactNode) => ReactNode
) => {
	return ({
		node: _node,
		children,
		className,
		...rest
	}: MarkdownComponentProps<T>) => {
		const content =
			transformChildren === undefined
				? children
				: transformChildren(children);

		return (
			// @ts-expect-error Generic component props spreading is complex but works at runtime
			<Tag
				{...defaultProps}
				{...rest}
				className={cn(
					(defaultProps as { className?: string } | undefined)
						?.className,
					className
				)}
			>
				{content}
			</Tag>
		);
	};
};

export const chatMarkdownComponents: Partial<Components> = {
	code: ({ node, className, children, ref: _ref, ...props }) => {
		const match = LANGUAGE_REGEX.exec(className || "");
		if (match) {
			const language = match[1] || "text";
			const code = String(children).replace(TRAILING_NEWLINE_REGEX, "");
			return (
				<CodeBlock code={code} language={language}>
					<CodeBlockDownloadButton />
					<CodeBlockCopyButton />
				</CodeBlock>
			);
		}
		return (
			<code
				className="whitespace-nowrap rounded-md border border-neutral-600 bg-neutral-400 px-1.5 py-0 font-mono text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
				{...props}
			>
				{children}
			</code>
		);
	},
	pre: ({ children }) => (
		<div className="not-prose my-4 w-full overflow-visible whitespace-pre-wrap break-words text-sm">
			{children}
		</div>
	),
	ol: ({ node, children, ref: _ref, ...props }) => {
		return (
			<ol className="ml-4 list-outside list-decimal" {...props}>
				{children}
			</ol>
		);
	},
	li: makeComponent("li", { className: listItemClassName }),
	ul: ({ node, children, ref: _ref, ...props }) => {
		return (
			<ul className="ml-4 list-outside list-disc" {...props}>
				{children}
			</ul>
		);
	},
	strong: ({ node, children, ref: _ref, ...props }) => {
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
				rel="noopener noreferrer"
				target="_blank"
				{...props}
			>
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
	blockquote: ({ node, children, ref: _ref, ...props }) => {
		return (
			<blockquote
				className="my-4 border-neutral-300 border-l-4 pl-4 text-neutral-600 italic dark:border-neutral-700 dark:text-neutral-400"
				{...props}
			>
				{children}
			</blockquote>
		);
	},
	hr: ({ ref: _ref, ...props }) => (
		<hr
			className="my-6 border-neutral-200 border-t dark:border-neutral-700"
			{...props}
		/>
	),
	table: ({ node, children, ...props }) => {
		return <DownloadableTable {...props}>{children}</DownloadableTable>;
	},
	thead: ({ node, children, ref: _ref, ...props }) => {
		return (
			<TableHeader className="dark:bg-neutral-900" {...props}>
				{children}
			</TableHeader>
		);
	},
	tbody: ({ node, children, ref: _ref, ...props }) => {
		return <TableBody {...props}>{children}</TableBody>;
	},
	tr: ({ node, children, ref: _ref, ...props }) => {
		return <TableRow {...props}>{children}</TableRow>;
	},
	th: ({ node, children, ref: _ref, ...props }) => {
		return <TableHead {...props}>{children}</TableHead>;
	},
	td: ({ node, children, ref: _ref, ...props }) => {
		return <TableCell {...props}>{children}</TableCell>;
	},
	img: ({ node, alt, src, width, height, ref: _ref, ...props }) => {
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

export const chatMarkdownRemarkPlugins = [remarkGfm, remarkMath];
export const chatMarkdownRehypePlugins = [rehypeKatex];

const NonMemoizedMarkdown = ({ children }: { children: string }) => {
	return (
		<div className="space-y-4 text-sm leading-7 sm:text-base">
			<ReactMarkdown
				components={chatMarkdownComponents}
				rehypePlugins={chatMarkdownRehypePlugins}
				remarkPlugins={chatMarkdownRemarkPlugins}
			>
				{children}
			</ReactMarkdown>
		</div>
	);
};

export const Markdown = memo(
	NonMemoizedMarkdown,
	(prevProps, nextProps) => prevProps.children === nextProps.children
);
