"use client";

import type * as React from "react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function Message({
	from,
	className,
	...props
}: React.ComponentProps<"div"> & {
	from: "user" | "assistant" | "system" | string;
}) {
	return (
		<div
			className={cn(
				"group/message flex w-full flex-col gap-3",
				from === "user" ? "items-end" : "items-start",
				className
			)}
			data-message-from={from}
			{...props}
		/>
	);
}

export function MessageContent({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"flex w-full flex-col gap-4",
				"group-data-[message-from=user]/message:w-auto group-data-[message-from=user]/message:max-w-[min(85%,42rem)]",
				className
			)}
			{...props}
		/>
	);
}

export function MessageResponse({
	children,
	className,
	components,
	rehypePlugins = [rehypeKatex],
	remarkPlugins = [remarkGfm, remarkMath],
	...props
}: React.ComponentProps<"div"> & {
	children: string;
	components?: Partial<Components>;
	rehypePlugins?: unknown[];
	remarkPlugins?: unknown[];
	parseIncompleteMarkdown?: boolean;
	allowedImagePrefixes?: string[];
	allowedLinkPrefixes?: string[];
	defaultOrigin?: string;
}) {
	return (
		<div
			className={cn(
				"space-y-4 text-sm leading-7 sm:text-base",
				"group-data-[message-from=user]/message:rounded-2xl group-data-[message-from=user]/message:bg-neutral-900 group-data-[message-from=user]/message:px-4 group-data-[message-from=user]/message:py-3 group-data-[message-from=user]/message:text-primary",
				className
			)}
			{...props}
		>
			<ReactMarkdown
				components={components}
				rehypePlugins={rehypePlugins as []}
				remarkPlugins={remarkPlugins as []}
			>
				{children}
			</ReactMarkdown>
		</div>
	);
}

export function MessageActions({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			className={cn("flex flex-wrap items-center gap-1", className)}
			{...props}
		/>
	);
}

export function MessageAction({
	tooltip,
	label,
	children,
	className,
	...props
}: React.ComponentProps<typeof Button> & {
	tooltip?: React.ReactNode;
	label: string;
}) {
	const button = (
		<Button
			aria-label={label}
			className={cn("text-xs", className)}
			size="icon"
			type="button"
			variant="ghost"
			{...props}
		>
			{children}
		</Button>
	);

	if (!tooltip) {
		return button;
	}

	return (
		<TooltipProvider delayDuration={200}>
			<Tooltip>
				<TooltipTrigger asChild>{button}</TooltipTrigger>
				<TooltipContent>{tooltip}</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

export function MessageToolbar({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			className={cn("flex items-center justify-between gap-2", className)}
			{...props}
		/>
	);
}
