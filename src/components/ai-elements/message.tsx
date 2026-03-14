"use client";

import { useTheme } from "next-themes";
import type * as React from "react";
import { Streamdown } from "streamdown";
import { Citation } from "@/components/chat/citation";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { normalizeCitationMarkup, streamdownPlugins } from "@/lib/streamdown";
import { cn } from "@/lib/utils";

type Options = React.ComponentPropsWithoutRef<typeof Streamdown>;
type Components = Options["components"];

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
				"flex w-full min-w-0 flex-col gap-4 overflow-hidden",
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
	plugins = streamdownPlugins,
	...props
}: Omit<Options, "children" | "components"> & {
	children: string;
	components?: Components;
}) {
	const { resolvedTheme } = useTheme();
	const mermaidTheme = resolvedTheme === "dark" ? "dark" : "default";

	return (
		<Streamdown
			allowedTags={{
				citation: [
					"id",
					"url",
					"title",
					"description",
					"quote",
					"items",
				],
			}}
			className={cn(
				"streamdown-content",
				"text-sm leading-7 sm:text-base",
				"group-data-[message-from=user]/message:rounded-2xl group-data-[message-from=user]/message:border group-data-[message-from=user]/message:border-border group-data-[message-from=user]/message:bg-card group-data-[message-from=user]/message:px-4 group-data-[message-from=user]/message:py-3 group-data-[message-from=user]/message:text-foreground dark:group-data-[message-from=user]/message:border-transparent dark:group-data-[message-from=user]/message:bg-neutral-900 dark:group-data-[message-from=user]/message:text-primary",
				className
			)}
			components={{
				...components,
				citation: ({ id, url, title, description, items }) => (
					<Citation
						description={(description as string) ?? ""}
						id={(id as string) ?? ""}
						items={typeof items === "string" ? items : undefined}
						title={(title as string) ?? ""}
						url={(url as string) ?? ""}
					/>
				),
			}}
			linkSafety={{
				enabled: false,
			}}
			mermaid={{
				config: {
					theme: mermaidTheme,
				},
			}}
			plugins={plugins}
			shikiTheme={["github-dark", "github-light"]}
			{...props}
		>
			{normalizeCitationMarkup(children)}
		</Streamdown>
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
