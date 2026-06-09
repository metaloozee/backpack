/** biome-ignore-all lint/performance/noNamespaceImport: Required for Radix UI primitives (shadcn/ui pattern) */
"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import type { ComponentPropsWithoutRef, ElementRef } from "react";

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

export { Avatar, AvatarFallback, AvatarImage };
