/** biome-ignore-all lint/performance/noNamespaceImport: Required for Radix UI primitives (shadcn/ui pattern) */
"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import type { ComponentPropsWithoutRef, ElementRef, RefObject } from "react";

import { cn } from "@/lib/utils/cn";

const AvatarFallback = ({
	className,
	ref,
	...props
}: ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> & {
	ref?: RefObject<ElementRef<typeof AvatarPrimitive.Fallback> | null>;
}) => (
	<AvatarPrimitive.Fallback
		className={cn(
			"flex h-full w-full items-center justify-center rounded-full bg-muted",
			className
		)}
		ref={ref}
		{...props}
	/>
);
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { AvatarFallback };
