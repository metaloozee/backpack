/** biome-ignore-all lint/performance/noNamespaceImport: React namespace used for types and utilities */
"use client";
import {
	AnimatePresence,
	MotionConfig,
	motion,
	type Transition,
	type Variant,
	type Variants,
} from "motion/react";
import * as React from "react";
import { createContext, useContext, useId, useState } from "react";
import { cn } from "@/lib/utils";

export interface DisclosureContextType {
	open: boolean;
	toggle: () => void;
	variants?: { expanded: Variant; collapsed: Variant };
}

const DisclosureContext = createContext<DisclosureContextType | undefined>(
	undefined
);

export interface DisclosureProviderProps {
	children: React.ReactNode;
	open: boolean;
	onOpenChange?: (open: boolean) => void;
	variants?: { expanded: Variant; collapsed: Variant };
}

function DisclosureProvider({
	children,
	open: openProp,
	onOpenChange,
	variants,
}: DisclosureProviderProps) {
	const [internalOpen, setInternalOpen] = useState(openProp);

	const isControlled = onOpenChange !== undefined;
	const open = isControlled ? openProp : internalOpen;

	const toggle = () => {
		if (isControlled) {
			onOpenChange(!openProp);
		} else {
			setInternalOpen((prev) => !prev);
		}
	};

	return (
		<DisclosureContext.Provider
			value={{
				open,
				toggle,
				variants,
			}}
		>
			{children}
		</DisclosureContext.Provider>
	);
}

function useDisclosure() {
	const context = useContext(DisclosureContext);
	if (!context) {
		throw new Error(
			"useDisclosure must be used within a DisclosureProvider"
		);
	}
	return context;
}

export interface DisclosureProps {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	children: React.ReactNode;
	className?: string;
	variants?: { expanded: Variant; collapsed: Variant };
	transition?: Transition;
}

export function Disclosure({
	open: openProp = false,
	onOpenChange,
	children,
	className,
	transition,
	variants,
}: DisclosureProps) {
	return (
		<MotionConfig transition={transition}>
			<div className={className}>
				<DisclosureProvider
					onOpenChange={onOpenChange}
					open={openProp}
					variants={variants}
				>
					{React.Children.toArray(children)[0]}
					{React.Children.toArray(children)[1]}
				</DisclosureProvider>
			</div>
		</MotionConfig>
	);
}

export function DisclosureTrigger({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	const { toggle, open } = useDisclosure();

	return (
		<>
			{React.Children.map(children, (child) => {
				return React.isValidElement(child)
					? React.cloneElement(child, {
							onClick: toggle,
							role: "button",
							"aria-expanded": open,
							tabIndex: 0,
							onKeyDown: (e: {
								key: string;
								preventDefault: () => void;
							}) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									toggle();
								}
							},
							className: cn(
								className,
								// @ts-expect-error
								(child as React.ReactElement).props.className
							),
							// @ts-expect-error
							...(child as React.ReactElement).props,
						})
					: child;
			})}
		</>
	);
}

export function DisclosureContent({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	const { open, variants } = useDisclosure();
	const uniqueId = useId();

	const BASE_VARIANTS: Variants = {
		expanded: {
			height: "auto",
			opacity: 1,
		},
		collapsed: {
			height: 0,
			opacity: 0,
		},
	};

	const combinedVariants = {
		expanded: { ...BASE_VARIANTS.expanded, ...variants?.expanded },
		collapsed: { ...BASE_VARIANTS.collapsed, ...variants?.collapsed },
	};

	return (
		<div className={cn("overflow-hidden", className)}>
			<AnimatePresence initial={false}>
				{open && (
					<motion.div
						animate="expanded"
						exit="collapsed"
						id={uniqueId}
						initial="collapsed"
						variants={combinedVariants}
					>
						{children}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

export default {
	Disclosure,
	DisclosureProvider,
	DisclosureTrigger,
	DisclosureContent,
};
