"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import {
	type ButtonHTMLAttributes,
	forwardRef,
	type MouseEvent,
	useState,
} from "react";
import { cn } from "@/lib/utils";

type SizeVariant = "sm" | "default" | "lg";

interface CopyButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	value?: string;
	onCopy?: () => void | Promise<void>;
	onError?: (error: Error) => void;
	size?: SizeVariant;
	timeout?: number;
}

const sizeMap: Record<SizeVariant, { button: string; icon: number }> = {
	sm: { button: "h-8 w-8", icon: 14 },
	default: { button: "h-9 w-9", icon: 16 },
	lg: { button: "h-12 w-12", icon: 20 },
};

const CopyButton = forwardRef<HTMLButtonElement, CopyButtonProps>(
	(
		{
			value,
			size = "default",
			className,
			onClick,
			onCopy,
			onError,
			timeout = 1500,
			...props
		},
		ref
	) => {
		const [copied, setCopied] = useState<boolean>(false);

		const handleCopy = async (event: MouseEvent<HTMLButtonElement>) => {
			if (!value) {
				onError?.(new Error("No text to copy"));
				onClick?.(event);
				return;
			}

			if (
				typeof window === "undefined" ||
				!navigator.clipboard?.writeText
			) {
				onError?.(new Error("Clipboard API not available"));
				onClick?.(event);
				return;
			}

			try {
				await navigator.clipboard.writeText(value ?? "");
				await onCopy?.();
				setCopied(true);
				setTimeout(() => setCopied(false), timeout);
			} catch (error) {
				onError?.(
					error instanceof Error
						? error
						: new Error("Failed to copy to clipboard")
				);
			}

			onClick?.(event);
		};

		const { button: buttonSize, icon: iconSize } = sizeMap[size];

		return (
			<button
				aria-label={copied ? "Copied" : "Copy to clipboard"}
				className={cn(
					"relative inline-flex cursor-pointer items-center justify-center rounded-md text-neutral-900 transition-all duration-200 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-100 dark:text-neutral-50",
					buttonSize,
					className
				)}
				disabled={copied}
				onClick={handleCopy}
				ref={ref}
				type="button"
				{...props}
			>
				<div
					className={cn(
						"transition-all duration-200",
						copied
							? "scale-100 opacity-100 blur-none"
							: "scale-70 opacity-0 blur-[2px]"
					)}
				>
					<CheckIcon
						aria-hidden="true"
						size={iconSize}
						strokeWidth={2}
					/>
				</div>
				<div
					className={cn(
						"absolute transition-all duration-200",
						copied
							? "scale-0 opacity-0 blur-[2px]"
							: "scale-100 opacity-100 blur-none"
					)}
				>
					<CopyIcon
						aria-hidden="true"
						size={iconSize}
						strokeWidth={2}
					/>
				</div>
			</button>
		);
	}
);

CopyButton.displayName = "CopyButton";

export { CopyButton };
export type { CopyButtonProps };
