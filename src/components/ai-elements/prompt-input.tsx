"use client";

import {
	CornerDownLeftIcon,
	MoreHorizontalIcon,
	PaperclipIcon,
	StopCircleIcon,
} from "lucide-react";
import type * as React from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface PromptInputMessage {
	text?: string;
	files?: File[];
}

interface PromptInputTooltipConfig {
	content: React.ReactNode;
	shortcut?: string;
}

function isPromptInputTooltipConfig(
	value: React.ReactNode | PromptInputTooltipConfig
): value is PromptInputTooltipConfig {
	return (
		typeof value === "object" &&
		value !== null &&
		!Array.isArray(value) &&
		"content" in value
	);
}

export function PromptInput({
	className,
	children,
	onSubmit,
	...formProps
}: Omit<React.ComponentProps<"form">, "onSubmit"> & {
	onSubmit?: (
		message: PromptInputMessage,
		event: React.FormEvent<HTMLFormElement>
	) => void;
}) {
	return (
		<form
			className={cn("w-full", className)}
			onSubmit={(event) => {
				onSubmit?.({}, event);
			}}
			{...formProps}
		>
			{children}
		</form>
	);
}

export function PromptInputHeader(props: React.ComponentProps<"div">) {
	return <div className={cn("px-4 pt-4", props.className)} {...props} />;
}

export function PromptInputBody(props: React.ComponentProps<"div">) {
	return <div className={cn("px-4", props.className)} {...props} />;
}

export function PromptInputFooter(props: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"flex items-center justify-between gap-3 px-4 pt-3 pb-4",
				props.className
			)}
			{...props}
		/>
	);
}

export function PromptInputTools(props: React.ComponentProps<"div">) {
	return (
		<div
			className={cn("flex items-center gap-2", props.className)}
			{...props}
		/>
	);
}

export function PromptInputTextarea(
	props: React.ComponentProps<typeof Textarea>
) {
	return (
		<Textarea
			className={cn(
				"min-h-[96px] w-full resize-none border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0",
				props.className
			)}
			{...props}
		/>
	);
}

export function PromptInputButton({
	tooltip,
	children,
	className,
	...props
}: React.ComponentProps<typeof Button> & {
	tooltip?: React.ReactNode | PromptInputTooltipConfig;
}) {
	const button = (
		<Button className={className} type="button" variant="ghost" {...props}>
			{children}
		</Button>
	);

	if (!tooltip) {
		return button;
	}

	let content: React.ReactNode;
	let shortcut: string | undefined;

	if (isPromptInputTooltipConfig(tooltip)) {
		content = tooltip.content;
		shortcut = tooltip.shortcut;
	} else {
		content = tooltip;
	}

	return (
		<Tooltip>
			<TooltipTrigger asChild>{button}</TooltipTrigger>
			<TooltipContent>
				<div className="flex items-center gap-2">
					<span>{content}</span>
					{shortcut ? (
						<span className="text-muted-foreground text-xs">
							{shortcut}
						</span>
					) : null}
				</div>
			</TooltipContent>
		</Tooltip>
	);
}

export function PromptInputSubmit({
	status,
	children,
	...props
}: React.ComponentProps<typeof Button> & {
	status?: "ready" | "submitted" | "streaming" | "error";
}) {
	const isStreaming = status === "submitted" || status === "streaming";

	return (
		<Button type="submit" {...props}>
			{children ??
				(isStreaming ? (
					<StopCircleIcon className="size-4" />
				) : (
					<CornerDownLeftIcon className="size-4" />
				))}
		</Button>
	);
}

export function PromptInputActionMenu(
	props: React.ComponentProps<typeof DropdownMenu>
) {
	return <DropdownMenu {...props} />;
}

export function PromptInputActionMenuTrigger(
	props: React.ComponentProps<typeof Button>
) {
	return (
		<DropdownMenuTrigger asChild>
			<Button type="button" variant="ghost" {...props}>
				{props.children ?? <MoreHorizontalIcon className="size-4" />}
			</Button>
		</DropdownMenuTrigger>
	);
}

export function PromptInputActionMenuContent(
	props: React.ComponentProps<typeof DropdownMenuContent>
) {
	return <DropdownMenuContent align="start" {...props} />;
}

export function PromptInputActionMenuItem(
	props: React.ComponentProps<typeof DropdownMenuItem>
) {
	return <DropdownMenuItem {...props} />;
}

export function PromptInputActionAddAttachments(
	props: React.ComponentProps<typeof DropdownMenuItem> & { label?: string }
) {
	return (
		<DropdownMenuItem {...props}>
			<PaperclipIcon className="size-4" />
			{props.label ?? "Add attachments"}
		</DropdownMenuItem>
	);
}

export function PromptInputSelect(props: React.ComponentProps<typeof Select>) {
	return <Select {...props} />;
}

export function PromptInputSelectTrigger(
	props: React.ComponentProps<typeof SelectTrigger>
) {
	return <SelectTrigger size="sm" {...props} />;
}

export function PromptInputSelectContent(
	props: React.ComponentProps<typeof SelectContent>
) {
	return <SelectContent {...props} />;
}

export function PromptInputSelectItem(
	props: React.ComponentProps<typeof SelectItem>
) {
	return <SelectItem {...props} />;
}

export function PromptInputSelectValue(
	props: React.ComponentProps<typeof SelectValue>
) {
	return <SelectValue {...props} />;
}
