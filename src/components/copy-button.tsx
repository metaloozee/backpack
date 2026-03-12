"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import {
	type ButtonHTMLAttributes,
	forwardRef,
	type MouseEvent,
	useEffect,
	useRef,
	useState,
} from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SizeVariant = "xs" | "sm" | "default" | "lg";

interface CopyButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	value?: string;
	onCopy?: () => void | Promise<void>;
	onCopyError?: (error: Error) => void;
	size?: SizeVariant;
	timeout?: number;
}

const sizeMap: Record<SizeVariant, { icon: string }> = {
	xs: { icon: "size-3" },
	sm: { icon: "size-3.5" },
	default: { icon: "size-4" },
	lg: { icon: "size-5" },
};

const CopyButton = forwardRef<HTMLButtonElement, CopyButtonProps>(
	(
		{
			value,
			size = "default",
			className,
			onClick,
			onCopy,
			onCopyError,
			timeout = 1500,
			...props
		},
		ref
	) => {
		const [copied, setCopied] = useState(false);
		const timeoutRef = useRef<number | null>(null);

		useEffect(() => {
			return () => {
				if (timeoutRef.current !== null) {
					window.clearTimeout(timeoutRef.current);
				}
			};
		}, []);

		const scheduleReset = () => {
			if (timeoutRef.current !== null) {
				window.clearTimeout(timeoutRef.current);
			}

			timeoutRef.current = window.setTimeout(() => {
				setCopied(false);
				timeoutRef.current = null;
			}, timeout);
		};

		const handleCopy = async (event: MouseEvent<HTMLButtonElement>) => {
			try {
				if (!value) {
					throw new Error("No text to copy");
				}

				if (
					typeof window === "undefined" ||
					!navigator.clipboard?.writeText
				) {
					throw new Error("Clipboard API not available");
				}

				await navigator.clipboard.writeText(value);
				await onCopy?.();
				setCopied(true);
				scheduleReset();
			} catch (error) {
				onCopyError?.(
					error instanceof Error
						? error
						: new Error("Failed to copy to clipboard")
				);
			} finally {
				onClick?.(event);
			}
		};

		const resolvedSize = sizeMap[size];

		return (
			<button
				aria-label={copied ? "Copied" : "Copy to clipboard"}
				className={cn(
					buttonVariants({ size: "icon", variant: "ghost" }),
					"relative overflow-hidden rounded-md text-foreground",
					className
				)}
				onClick={handleCopy}
				ref={ref}
				type="button"
				{...props}
			>
				<CheckIcon
					aria-hidden="true"
					className={cn(
						"absolute transition-all duration-200 ease-out",
						resolvedSize.icon,
						copied ? "scale-100 opacity-100" : "scale-75 opacity-0"
					)}
					strokeWidth={2}
				/>
				<CopyIcon
					aria-hidden="true"
					className={cn(
						"transition-all duration-200 ease-out",
						resolvedSize.icon,
						copied ? "scale-75 opacity-0" : "scale-100 opacity-100"
					)}
					strokeWidth={2}
				/>
			</button>
		);
	}
);

CopyButton.displayName = "CopyButton";

export { CopyButton };
export type { CopyButtonProps };
