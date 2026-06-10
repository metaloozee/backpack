/** biome-ignore-all lint/performance/noNamespaceImport: Required for Radix UI primitives (shadcn/ui pattern) */
"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import type { ComponentPropsWithoutRef, ElementRef, RefObject } from "react";

import { cn } from "@/lib/utils/cn";

const AvatarImage = ({
	className,
	ref,
	...props
}: ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> & {
	ref?: RefObject<ElementRef<typeof AvatarPrimitive.Image> | null>;
}) => (
	<AvatarPrimitive.Image
		className={cn("aspect-square h-full w-full", className)}
		ref={ref}
		{...props}
	/>
);
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

export { AvatarImage };
