"use client";

import { DownloadIcon } from "lucide-react";
import type { ComponentProps, HTMLAttributes, ReactNode } from "react";
import { createContext, useContext } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
	oneDark,
	oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CodeBlockContextType {
	code: string;
	language: string;
}

const CodeBlockContext = createContext<CodeBlockContextType>({
	code: "",
	language: "text",
});

export type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
	code: string;
	language: string;
	showLineNumbers?: boolean;
	children?: ReactNode;
};

export const CodeBlock = ({
	code,
	language,
	showLineNumbers = false,
	className,
	children,
	...props
}: CodeBlockProps) => (
	<CodeBlockContext.Provider value={{ code, language }}>
		<div
			className={cn(
				"relative w-full min-w-0 overflow-hidden rounded-md border bg-background text-foreground",
				className
			)}
			{...props}
		>
			<div className="flex items-center justify-between border-b bg-muted/50 px-4 py-2">
				<span className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
					{language}
				</span>
				{children && (
					<div className="flex items-center gap-1">{children}</div>
				)}
			</div>

			<div className="relative">
				<SyntaxHighlighter
					className="overflow-hidden dark:hidden"
					codeTagProps={{
						className: "font-mono text-sm",
					}}
					customStyle={{
						margin: 0,
						padding: "1rem",
						fontSize: "0.875rem",
						background: "var(--background)",
						color: "var(--foreground)",
						overflowX: "auto",
						overflowWrap: "break-word",
						wordBreak: "break-all",
					}}
					language={language}
					lineNumberStyle={{
						color: "var(--muted-foreground)",
						paddingRight: "1rem",
						minWidth: "2.5rem",
					}}
					showLineNumbers={showLineNumbers}
					style={oneLight}
				>
					{code}
				</SyntaxHighlighter>
				<SyntaxHighlighter
					className="hidden overflow-hidden dark:block"
					codeTagProps={{
						className: "font-mono text-sm",
					}}
					customStyle={{
						margin: 0,
						padding: "1rem",
						fontSize: "0.875rem",
						background: "var(--background)",
						color: "var(--foreground)",
						overflowX: "auto",
						overflowWrap: "break-word",
						wordBreak: "break-all",
					}}
					language={language}
					lineNumberStyle={{
						color: "var(--muted-foreground)",
						paddingRight: "1rem",
						minWidth: "2.5rem",
					}}
					showLineNumbers={showLineNumbers}
					style={oneDark}
				>
					{code}
				</SyntaxHighlighter>
			</div>
		</div>
	</CodeBlockContext.Provider>
);

export type CodeBlockCopyButtonProps = Omit<
	ComponentProps<typeof CopyButton>,
	"value" | "onCopy" | "onCopyError" | "timeout" | "children"
> & {
	onCopy?: () => void;
	onCopyError?: (error: Error) => void;
	timeout?: number;
};

export const CodeBlockCopyButton = ({
	onCopy,
	onCopyError,
	timeout = 2000,
	className,
	...rest
}: CodeBlockCopyButtonProps) => {
	const { code } = useContext(CodeBlockContext);

	return (
		<CopyButton
			className={cn("size-8 shrink-0", className)}
			onCopy={onCopy}
			onCopyError={onCopyError}
			size="sm"
			timeout={timeout}
			value={code}
			{...rest}
		/>
	);
};

export type CodeBlockDownloadButtonProps = ComponentProps<typeof Button> & {
	onDownload?: () => void;
	onError?: (error: Error) => void;
	filename?: string;
};

const FILE_EXTENSIONS: Record<string, string> = {
	javascript: "js",
	typescript: "ts",
	python: "py",
	java: "java",
	cpp: "cpp",
	c: "c",
	csharp: "cs",
	go: "go",
	rust: "rs",
	php: "php",
	ruby: "rb",
	swift: "swift",
	kotlin: "kt",
	bash: "sh",
	shell: "sh",
	powershell: "ps1",
	sql: "sql",
	json: "json",
	yaml: "yaml",
	xml: "xml",
	html: "html",
	css: "css",
	markdown: "md",
};

export const CodeBlockDownloadButton = ({
	onDownload,
	onError,
	filename,
	children,
	className,
	...props
}: CodeBlockDownloadButtonProps) => {
	const { code, language } = useContext(CodeBlockContext);

	const downloadCode = () => {
		const extension = FILE_EXTENSIONS[language.toLowerCase()] || "txt";
		const finalFilename = filename || `code.${extension}`;
		try {
			const blob = new Blob([code], { type: "text/plain" });
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = finalFilename;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
			if (onDownload) {
				onDownload();
			}
		} catch (error) {
			if (onError) {
				onError(error as Error);
			}
		}
	};

	return (
		<Button
			className={cn("size-8 shrink-0", className)}
			onClick={downloadCode}
			size="icon"
			type="button"
			variant="ghost"
			{...props}
		>
			{children ?? <DownloadIcon className="size-3.5" />}
		</Button>
	);
};
