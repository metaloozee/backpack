"use client";

import { GripVerticalIcon } from "lucide-react";
import type { Ref } from "react";
import * as ResizablePrimitive from "react-resizable-panels";

import { cn } from "@/lib/utils/cn";

function ResizablePanelGroup({
	className,
	...props
}: ResizablePrimitive.PanelGroupProps) {
	return (
		<ResizablePrimitive.PanelGroup
			className={cn(
				"flex h-full w-full aria-[orientation=vertical]:flex-col",
				className
			)}
			data-slot="resizable-panel-group"
			{...props}
		/>
	);
}

function ResizablePanel({
	ref,
	...props
}: ResizablePrimitive.PanelProps & {
	ref?: Ref<ResizablePrimitive.ImperativePanelHandle>;
}) {
	return (
		<ResizablePrimitive.Panel
			data-slot="resizable-panel"
			ref={ref}
			{...props}
		/>
	);
}

function ResizableHandle({
	withHandle,
	className,
	...props
}: ResizablePrimitive.PanelResizeHandleProps & {
	withHandle?: boolean;
}) {
	return (
		<ResizablePrimitive.PanelResizeHandle
			className={cn(
				"relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-hidden aria-[orientation=horizontal]:h-px aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:after:left-0 aria-[orientation=horizontal]:after:h-1 aria-[orientation=horizontal]:after:w-full aria-[orientation=horizontal]:after:translate-x-0 aria-[orientation=horizontal]:after:-translate-y-1/2 [&[aria-orientation=horizontal]>div]:rotate-90",
				className
			)}
			data-slot="resizable-handle"
			{...props}
		>
			{withHandle && (
				<div className="z-10 flex h-4 w-3 items-center justify-center rounded-xs border bg-border">
					<GripVerticalIcon className="size-2.5" />
				</div>
			)}
		</ResizablePrimitive.PanelResizeHandle>
	);
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup };
