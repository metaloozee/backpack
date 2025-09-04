"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const LANGUAGE_REGEX = /language-(\w+)/;
const TRAILING_NEWLINE_REGEX = /\n$/;

const COPY_FEEDBACK_DURATION = 1500;

export function CodeBlock({ className, children }: { className?: string; children?: React.ReactNode }) {
	const match = LANGUAGE_REGEX.exec(className || "");
	const language = match?.[1] || "text";
	const code = String(children).replace(TRAILING_NEWLINE_REGEX, "");

	const [copied, setCopied] = React.useState(false);

	const handleCopy = React.useCallback(() => {
		if (!navigator?.clipboard) {
			return;
		}
		navigator.clipboard
			.writeText(code)
			.then(() => {
				setCopied(true);
				toast.success("Copied to clipboard");
				setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION);
			})
			.catch(() => {
				toast.error("Failed to copy");
			});
	}, [code]);

	return (
		<div className="group relative w-full max-w-2xl overflow-visible rounded-md border border-neutral-200 bg-neutral-950 text-neutral-50 dark:border-neutral-800">
			{/* {language !== 'text' && (
                <span className="pointer-events-none select-none rounded px-1.5 text-[10px] font-medium uppercase tracking-wider text-neutral-400/90 ring-1 ring-inset ring-neutral-700/50">
                    {language}
                </span>
            )} */}
			<SyntaxHighlighter
				customStyle={{
					margin: 0,
					padding: "1rem",
					fontSize: "0.875rem",
					lineHeight: "1.5",
					background: "transparent",
					borderRadius: "0.5rem",
					width: "100%",
					whiteSpace: "pre-wrap",
					wordBreak: "break-word",
					overflowWrap: "anywhere",
					wordWrap: "break-word",
				}}
				language={language}
				style={vscDarkPlus}
				wrapLongLines
			>
				{code}
			</SyntaxHighlighter>

			<TooltipProvider delayDuration={100}>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							className="absolute top-2 right-2 z-10 opacity-0 transition-opacity group-hover:opacity-100"
							onClick={handleCopy}
							size="icon"
							type="button"
							variant="ghost"
						>
							{copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
						</Button>
					</TooltipTrigger>
					<TooltipContent side="left">{copied ? "Copied" : "Copy code"}</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</div>
	);
}
