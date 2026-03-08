"use client";

import {
	AlertCircleIcon,
	CheckCircle2Icon,
	ChevronDownIcon,
	WrenchIcon,
} from "lucide-react";
import type * as React from "react";
import { CodeBlock } from "@/components/chat/code-block";
import { Spinner } from "@/components/spinner";
import { Badge } from "@/components/ui/badge";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

const TOOL_PREFIX_REGEX = /^tool-/;

type ToolState =
	| "input-streaming"
	| "input-available"
	| "approval-requested"
	| "approval-responded"
	| "output-available"
	| "output-error"
	| "output-denied";

function formatToolName(type: string) {
	return type
		.replace(TOOL_PREFIX_REGEX, "")
		.replaceAll("_", " ")
		.replaceAll("-", " ")
		.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getStatusBadge(state: ToolState) {
	switch (state) {
		case "input-streaming":
			return (
				<Badge variant="secondary">
					<Spinner className="size-3" size="sm" />
					Pending
				</Badge>
			);
		case "input-available":
			return (
				<Badge variant="secondary">
					<Spinner className="size-3" size="sm" />
					Running
				</Badge>
			);
		case "output-error":
			return (
				<Badge variant="destructive">
					<AlertCircleIcon className="size-3" />
					Error
				</Badge>
			);
		case "output-available":
			return (
				<Badge variant="secondary">
					<CheckCircle2Icon className="size-3" />
					Completed
				</Badge>
			);
		default:
			return (
				<Badge variant="outline">
					<WrenchIcon className="size-3" />
					{state}
				</Badge>
			);
	}
}

export function Tool(props: React.ComponentProps<typeof Collapsible>) {
	return (
		<Collapsible
			className={cn(
				"w-full rounded-xl border bg-muted/20",
				props.className
			)}
			{...props}
		/>
	);
}

export function ToolHeader({
	title,
	toolType,
	state,
	toolName,
	className,
	...props
}: React.ComponentProps<typeof CollapsibleTrigger> & {
	title?: string;
	toolType: string;
	state: ToolState;
	toolName?: string;
}) {
	const label = title ?? formatToolName(toolName ?? toolType);

	return (
		<CollapsibleTrigger
			className={cn(
				"flex w-full items-center justify-between gap-3 px-4 py-3 text-left",
				className
			)}
			{...props}
		>
			<span className="flex min-w-0 items-center gap-2">
				<WrenchIcon className="size-4 shrink-0 text-muted-foreground" />
				<span className="truncate font-medium text-sm">{label}</span>
			</span>
			<span className="flex items-center gap-2">
				{getStatusBadge(state)}
				<ChevronDownIcon className="size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
			</span>
		</CollapsibleTrigger>
	);
}

export function ToolContent({
	className,
	...props
}: React.ComponentProps<typeof CollapsibleContent>) {
	return (
		<CollapsibleContent
			className={cn("space-y-3 border-t px-4 py-3", className)}
			{...props}
		/>
	);
}

export function ToolInput({
	input,
	className,
	...props
}: React.ComponentProps<"div"> & {
	input?: unknown;
}) {
	if (input === undefined) {
		return null;
	}

	return (
		<div className={cn("space-y-2", className)} {...props}>
			<p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
				Input
			</p>
			<CodeBlock
				className="overflow-auto"
				code={JSON.stringify(input, null, 2)}
				language="json"
			/>
		</div>
	);
}

export function ToolOutput({
	output,
	errorText,
	className,
	...props
}: React.ComponentProps<"div"> & {
	output?: React.ReactNode;
	errorText?: string;
}) {
	return (
		<div className={cn("space-y-2", className)} {...props}>
			<p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
				Output
			</p>
			{errorText ? (
				<div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive text-sm">
					{errorText}
				</div>
			) : (
				output
			)}
		</div>
	);
}
