"use client";

import { FileIcon, XIcon } from "lucide-react";
import Image from "next/image";
import type * as React from "react";
import { createContext, useContext } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AttachmentVariant = "grid" | "inline" | "list";

interface AttachmentData {
	id?: string;
	url?: string;
	mediaType?: string;
	filename?: string;
	name?: string;
}

interface AttachmentContextValue {
	data: AttachmentData;
	onRemove?: () => void;
	variant: AttachmentVariant;
}

const AttachmentContext = createContext<AttachmentContextValue | null>(null);

function useAttachment() {
	const context = useContext(AttachmentContext);

	if (!context) {
		throw new Error("Attachment components must be used within Attachment");
	}

	return context;
}

function getAttachmentName(data: AttachmentData) {
	return data.filename ?? data.name ?? "Attachment";
}

function isImage(data: AttachmentData) {
	return data.mediaType?.startsWith("image/") ?? false;
}

export function Attachments({
	variant = "grid",
	className,
	...props
}: React.ComponentProps<"div"> & {
	variant?: AttachmentVariant;
}) {
	return (
		<div
			className={cn(
				variant === "grid" && "grid grid-cols-1 gap-2 sm:grid-cols-2",
				variant === "inline" && "flex flex-wrap gap-2",
				variant === "list" && "flex flex-col gap-2",
				className
			)}
			data-attachments-variant={variant}
			{...props}
		/>
	);
}

export function Attachment({
	data,
	onRemove,
	children,
	className,
	variant = "grid",
	...props
}: React.ComponentProps<"div"> & {
	data: AttachmentData;
	onRemove?: () => void;
	variant?: AttachmentVariant;
}) {
	return (
		<AttachmentContext.Provider value={{ data, onRemove, variant }}>
			<div
				className={cn(
					"group/attachment relative overflow-hidden rounded-xl border bg-muted/20",
					variant === "inline" &&
						"flex items-center gap-2 rounded-full px-3 py-2",
					variant === "list" && "flex items-center gap-3 px-3 py-2",
					variant === "grid" && "flex min-h-20 flex-col",
					className
				)}
				{...props}
			>
				{children}
			</div>
		</AttachmentContext.Provider>
	);
}

export function AttachmentPreview({
	className,
	fallbackIcon,
	...props
}: React.ComponentProps<"div"> & {
	fallbackIcon?: React.ReactNode;
}) {
	const { data, variant } = useAttachment();
	const attachmentName = getAttachmentName(data);
	const image = isImage(data) && data.url;

	return (
		<div
			className={cn(
				"relative overflow-hidden bg-muted",
				variant === "inline" && "size-8 rounded-md",
				variant === "list" && "size-10 rounded-md",
				variant === "grid" && "aspect-video w-full",
				className
			)}
			{...props}
		>
			{image ? (
				<Image
					alt={attachmentName}
					className="object-cover"
					fill
					sizes={
						variant === "grid"
							? "(max-width: 768px) 100vw, 320px"
							: "48px"
					}
					src={data.url ?? ""}
				/>
			) : (
				<div className="flex size-full items-center justify-center text-muted-foreground">
					{fallbackIcon ?? <FileIcon className="size-4" />}
				</div>
			)}
		</div>
	);
}

export function AttachmentInfo({
	className,
	showMediaType = false,
	...props
}: React.ComponentProps<"div"> & {
	showMediaType?: boolean;
}) {
	const { data } = useAttachment();
	const attachmentName = getAttachmentName(data);

	return (
		<div className={cn("min-w-0", className)} {...props}>
			<p className="truncate text-sm">{attachmentName}</p>
			{showMediaType && data.mediaType ? (
				<p className="truncate text-muted-foreground text-xs">
					{data.mediaType}
				</p>
			) : null}
		</div>
	);
}

export function AttachmentRemove(
	props: React.ComponentProps<typeof Button> & { label?: string }
) {
	const { onRemove } = useAttachment();

	if (!onRemove) {
		return null;
	}

	return (
		<Button
			aria-label={props.label ?? "Remove attachment"}
			className={cn(
				"absolute top-2 right-2 size-7 opacity-0 transition-opacity group-hover/attachment:opacity-100",
				props.className
			)}
			onClick={(event) => {
				props.onClick?.(event);
				if (event.defaultPrevented) {
					return;
				}
				onRemove();
			}}
			size="icon"
			type="button"
			variant="secondary"
			{...props}
		>
			<XIcon className="size-3" />
		</Button>
	);
}
