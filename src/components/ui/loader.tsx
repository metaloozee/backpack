"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "motion/react";
import * as React from "react";
import { cn } from "@/lib/utils";

const loaderVariants = cva("rounded-full border-2 will-change-transform", {
	variants: {
		size: {
			sm: "size-3",
			default: "size-4",
			md: "size-5",
			lg: "size-6",
			xl: "size-8",
		},
		variant: {
			default: "border-muted border-t-current",
			primary: "border-primary/20 border-t-primary",
			secondary: "border-secondary/20 border-t-secondary",
			destructive: "border-destructive/20 border-t-destructive",
			muted: "border-muted border-t-muted-foreground",
			accent: "border-accent/20 border-t-accent-foreground",
		},
		speed: {
			slow: "",
			default: "",
			fast: "",
		},
	},
	defaultVariants: {
		size: "default",
		variant: "default",
		speed: "default",
	},
});

const speedConfig = {
	slow: { duration: 2 },
	default: { duration: 1 },
	fast: { duration: 0.6 },
} as const;

interface LoaderProps extends VariantProps<typeof loaderVariants> {
	/**
	 * Additional CSS classes to apply
	 */
	className?: string;
	/**
	 * Whether to show the loader
	 * @default true
	 */
	show?: boolean;
	/**
	 * Test id for testing purposes
	 */
	"data-testid"?: string;
}

function Loader({ className, size, variant, speed = "default", show = true, "data-testid": testId }: LoaderProps) {
	if (!show) return null;

	return (
		<motion.div
			animate={{ rotate: 360 }}
			className={cn(loaderVariants({ size, variant, speed }), className)}
			data-testid={testId}
			transition={{
				...speedConfig[speed!],
				repeat: Number.POSITIVE_INFINITY,
				ease: "linear",
			}}
		/>
	);
}

export { Loader, loaderVariants, type LoaderProps };
