"use client";

import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import type * as React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { Markdown } from "@/components/chat/markdown";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Loader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";

interface ReasoningContextValue {
	isOpen: boolean;
	setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
	isStreaming: boolean;
	duration?: number;
}

const ReasoningContext = createContext<ReasoningContextValue | null>(null);

export function useReasoning() {
	const context = useContext(ReasoningContext);

	if (!context) {
		throw new Error(
			"useReasoning must be used within a Reasoning component"
		);
	}

	return context;
}

export function Reasoning({
	children,
	className,
	isStreaming = false,
	open,
	defaultOpen = true,
	onOpenChange,
	duration,
	...props
}: React.ComponentProps<typeof Collapsible> & {
	isStreaming?: boolean;
	duration?: number;
}) {
	const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
	const isControlled = open !== undefined;
	const isOpen = isControlled ? open : uncontrolledOpen;

	useEffect(() => {
		if (isControlled) {
			return;
		}

		setUncontrolledOpen(isStreaming);
	}, [isControlled, isStreaming]);

	const setIsOpen = useCallback<
		React.Dispatch<React.SetStateAction<boolean>>
	>(
		(value) => {
			const nextValue =
				typeof value === "function" ? value(isOpen) : value;
			onOpenChange?.(nextValue);

			if (!isControlled) {
				setUncontrolledOpen(nextValue);
			}
		},
		[isControlled, isOpen, onOpenChange]
	);

	const contextValue = useMemo(
		() => ({
			isOpen,
			setIsOpen,
			isStreaming,
			duration,
		}),
		[duration, isOpen, isStreaming, setIsOpen]
	);

	return (
		<ReasoningContext.Provider value={contextValue}>
			<Collapsible
				className={cn(
					"w-full rounded-xl border bg-muted/25 p-3",
					className
				)}
				onOpenChange={setIsOpen}
				open={isOpen}
				{...props}
			>
				{children}
			</Collapsible>
		</ReasoningContext.Provider>
	);
}

export function ReasoningTrigger({
	className,
	getThinkingMessage,
	...props
}: React.ComponentProps<typeof CollapsibleTrigger> & {
	getThinkingMessage?: (
		isStreaming: boolean,
		duration?: number
	) => React.ReactNode;
}) {
	const { isOpen, isStreaming, duration } = useReasoning();

	const label =
		getThinkingMessage?.(isStreaming, duration) ??
		(isStreaming ? "Thinking..." : "Reasoning");

	return (
		<CollapsibleTrigger
			className={cn(
				"flex w-full items-center justify-between gap-3 text-left text-muted-foreground text-sm",
				className
			)}
			{...props}
		>
			<span className="flex items-center gap-2">
				{isStreaming && <Loader size="sm" />}
				{label}
			</span>
			{isOpen ? (
				<ChevronUpIcon className="size-4" />
			) : (
				<ChevronDownIcon className="size-4" />
			)}
		</CollapsibleTrigger>
	);
}

export function ReasoningContent({
	children,
	className,
	...props
}: Omit<React.ComponentProps<typeof CollapsibleContent>, "children"> & {
	children: string;
}) {
	return (
		<CollapsibleContent
			className={cn("pt-3 text-muted-foreground text-sm", className)}
			{...props}
		>
			<Markdown>{children}</Markdown>
		</CollapsibleContent>
	);
}
