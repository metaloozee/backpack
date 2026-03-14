"use client";

import { ChevronDownIcon, DownloadIcon, MessageSquareIcon } from "lucide-react";
import type * as React from "react";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Conversation({
	children,
	className,
	...props
}: React.ComponentProps<typeof StickToBottom>) {
	return (
		<StickToBottom
			className={cn("relative flex min-h-0 flex-1 flex-col", className)}
			initial="instant"
			resize="instant"
			{...props}
		>
			{children}
		</StickToBottom>
	);
}

export function ConversationContent({
	children,
	className,
	...props
}: Omit<
	React.ComponentProps<typeof StickToBottom.Content>,
	"scrollClassName"
>) {
	return (
		<StickToBottom.Content
			className={cn(
				"mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-4 pt-10 pb-6 sm:px-6",
				className
			)}
			scrollClassName="h-full overflow-y-auto overflow-x-hidden"
			{...props}
		>
			{children}
		</StickToBottom.Content>
	);
}

export function ConversationEmptyState({
	title,
	description,
	icon,
	children,
	className,
	...props
}: React.ComponentProps<"div"> & {
	title: string;
	description: string;
	icon?: React.ReactNode;
}) {
	return (
		<div
			className={cn(
				"flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center",
				className
			)}
			{...props}
		>
			<div className="rounded-full border bg-muted/50 p-3">
				{icon ?? (
					<MessageSquareIcon className="size-6 text-muted-foreground" />
				)}
			</div>
			<div className="space-y-1">
				<h2 className="font-medium text-lg">{title}</h2>
				<p className="text-muted-foreground text-sm">{description}</p>
			</div>
			{children}
		</div>
	);
}

export function ConversationScrollButton(
	props: React.ComponentProps<typeof Button>
) {
	const { isAtBottom, scrollToBottom } = useStickToBottomContext();
	const { className: propsClassName, onClick: propsOnClick, ...rest } = props;

	if (isAtBottom) {
		return null;
	}

	return (
		<Button
			{...rest}
			className={cn(
				"absolute bottom-2 left-1/2 z-20 -translate-x-1/2 rounded-full border bg-background/40 backdrop-blur-sm",
				propsClassName
			)}
			onClick={(event) => {
				propsOnClick?.(event);
				if (event.defaultPrevented) {
					return;
				}
				scrollToBottom();
			}}
			size="sm"
			type="button"
			variant="secondary"
		>
			<span className="font-normal text-xs">Scroll To Bottom</span>
			<ChevronDownIcon className="size-3" />
		</Button>
	);
}

export function messagesToMarkdown<
	TMessage extends {
		role: string;
		parts?: Array<{ type: string; text?: string }>;
	},
>(
	messages: TMessage[],
	formatMessage?: (message: TMessage, index: number) => string
) {
	return messages
		.map((message, index) => {
			if (formatMessage) {
				return formatMessage(message, index);
			}

			const text = message.parts
				?.filter((part) => part.type === "text")
				.map((part) => part.text ?? "")
				.join("\n")
				.trim();

			return `## ${message.role}\n\n${text ?? ""}`;
		})
		.join("\n\n");
}

export function ConversationDownload<
	TMessage extends {
		role: string;
		parts?: Array<{ type: string; text?: string }>;
	},
>({
	messages,
	filename = "conversation.md",
	formatMessage,
	...props
}: Omit<React.ComponentProps<typeof Button>, "onClick"> & {
	messages: TMessage[];
	filename?: string;
	formatMessage?: (message: TMessage, index: number) => string;
}) {
	return (
		<Button
			onClick={() => {
				const markdown = messagesToMarkdown(messages, formatMessage);
				const blob = new Blob([markdown], { type: "text/markdown" });
				const url = URL.createObjectURL(blob);
				const link = document.createElement("a");
				link.href = url;
				link.download = filename;
				link.click();
				URL.revokeObjectURL(url);
			}}
			size="icon"
			type="button"
			variant="ghost"
			{...props}
		>
			<DownloadIcon className="size-4" />
			<span className="sr-only">Download conversation</span>
		</Button>
	);
}
