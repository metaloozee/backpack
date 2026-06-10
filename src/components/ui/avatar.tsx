/** biome-ignore-all lint/performance/noNamespaceImport: Required for Radix UI primitives (shadcn/ui pattern) */
"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import type { ComponentPropsWithoutRef, ElementRef, RefObject } from "react";

import { cn } from "@/lib/utils/cn";

const Avatar = ({
	className,
	ref,
	...props
}: ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & {
	ref?: RefObject<ElementRef<typeof AvatarPrimitive.Root> | null>;
}) => (
	<AvatarPrimitive.Root
		className={cn(
			"relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
			className
		)}
		ref={ref}
		{...props}
	/>
);
Avatar.displayName = AvatarPrimitive.Root.displayName;

export { AvatarFallback } from "./avatar-fallback";
export { AvatarImage } from "./avatar-image";
export { Avatar };
