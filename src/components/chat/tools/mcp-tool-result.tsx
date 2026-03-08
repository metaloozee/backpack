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
	input?: unknown;
	output?: unknown;
	isError?: boolean;
	state?:
		| "input-streaming"
		| "input-available"
		| "output-available"
		| "output-error";
	toolCallId: string;
	isOpen?: boolean;
}

function formatToolPayload(payload: unknown) {
	if (typeof payload === "string") {
		return payload;
	}

	return JSON.stringify(payload, null, 2);
}

export function McpToolResult({
	serverName,
	toolName,
	input,
	output,
	isError = false,
	state,
	toolCallId,
}: McpToolResultProps) {
	const isLoading =
		state === "input-streaming" || state === "input-available";
	const formattedInput =
		input === undefined ? null : formatToolPayload(input);
	const formattedOutput =
		output === undefined ? null : formatToolPayload(output);

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
					{formattedInput ? (
						<div className="space-y-2 pt-2">
							<p className="text-[10px] text-muted-foreground uppercase tracking-wide">
								Input
							</p>
							<CodeBlock
								className="overflow-auto rounded-sm bg-neutral-950 font-mono text-[10px] leading-4"
								code={formattedInput}
								language="json"
							/>
						</div>
					) : null}
					{formattedOutput ? (
						<div className="space-y-2 pt-2 pb-4">
							<p className="text-[10px] text-muted-foreground uppercase tracking-wide">
								Output
							</p>
							<CodeBlock
								className="overflow-auto rounded-sm bg-neutral-950 font-mono text-[10px] leading-4"
								code={formattedOutput}
								language="json"
							/>
						</div>
					) : null}
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	);
}
