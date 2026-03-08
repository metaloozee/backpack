"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Spinner } from "@/components/spinner";
import { cn } from "@/lib/utils";

const loaderVariants = cva("", {
	variants: {
		size: {
			sm: "size-3",
			default: "size-4",
			md: "size-5",
			lg: "size-6",
			xl: "size-8",
		},
		variant: {
			default: "text-muted-foreground",
			primary: "text-primary",
			secondary: "text-secondary-foreground",
			destructive: "text-destructive",
			muted: "text-muted-foreground",
			accent: "text-accent-foreground",
		},
	},
	defaultVariants: {
		size: "default",
		variant: "default",
	},
});

const speedMap = {
	slow: "slow",
	default: "normal",
	fast: "fast",
} as const;

interface LoaderProps extends VariantProps<typeof loaderVariants> {
	className?: string;
	show?: boolean;
	speed?: keyof typeof speedMap;
	"data-testid"?: string;
}

function Loader({
	className,
	size,
	variant,
	speed = "default",
	show = true,
	"data-testid": testId,
}: LoaderProps) {
	if (!show) {
		return null;
	}

	return (
		<Spinner
			className={cn(loaderVariants({ size, variant }), className)}
			data-testid={testId}
			speed={speedMap[speed ?? "default"]}
		/>
	);
}

export { Loader, loaderVariants, type LoaderProps };
