"use client";

import { ChevronDownIcon } from "@radix-ui/react-icons";
import { ServerIcon } from "lucide-react";
import { CodeBlock } from "@/components/chat/code-block";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Loader } from "@/components/ui/loader";

export interface McpToolResultProps {
	serverName: string;
	toolName: string;
	content: unknown;
	isError?: boolean;
	state?:
		| "input-streaming"
		| "input-available"
		| "output-available"
		| "output-error";
	toolCallId: string;
	isOpen?: boolean;
}

export function McpToolResult({
	serverName,
	toolName,
	content,
	isError = false,
	state,
	toolCallId,
}: McpToolResultProps) {
	const isLoading =
		state === "input-streaming" || state === "input-available";
	const formattedContent =
		typeof content === "string"
			? content
			: JSON.stringify(content, null, 2);

	if (isLoading) {
		return (
			<div className="flex h-10 w-full items-center gap-2 rounded-md border bg-neutral-900 px-4 text-xs">
				<Loader size="sm" />
				<span className="text-muted-foreground">{serverName}</span>
				<span className="text-muted-foreground">/</span>
				<span>{toolName}</span>
			</div>
		);
	}

	return (
		<Accordion className="w-full">
			<AccordionItem
				className="rounded-md border bg-neutral-900 px-4"
				value={toolCallId}
			>
				<AccordionTrigger className="flex h-10 w-full items-center justify-between gap-2 text-xs">
					<span className="flex items-center gap-2 truncate">
						<ServerIcon
							className={`size-3 ${isError ? "text-red-400" : ""}`}
						/>
						<span className="text-muted-foreground">
							{serverName}
						</span>
						<span className="text-muted-foreground">/</span>
						<span className={isError ? "text-red-400" : ""}>
							{toolName}
						</span>
						{isError && (
							<span className="text-red-400 text-xs">
								(error)
							</span>
						)}
					</span>
					<ChevronDownIcon className="size-3 transition-transform duration-200 group-data-[expanded]:rotate-180" />
				</AccordionTrigger>
				<AccordionContent className="space-y-1">
					<div className="pt-2 pb-4">
						<CodeBlock
							className="overflow-auto rounded-sm bg-neutral-950 font-mono text-[6px] leading-4"
							code={formattedContent}
							language="json"
						/>
					</div>
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	);
}
