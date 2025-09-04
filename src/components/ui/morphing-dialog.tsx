"use client";

import { XIcon } from "lucide-react";
import { AnimatePresence, MotionConfig, motion, type Transition, type Variant } from "motion/react";
import React, { useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { backdropVariants, layoutTransition, modalVariants, transitions } from "@/lib/animations";
import useClickOutside from "@/lib/hooks/use-click-outside";
import { cn } from "@/lib/utils";

export type MorphingDialogContextType = {
	isOpen: boolean;
	setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
	uniqueId: string;
	triggerRef: React.RefObject<HTMLDivElement>;
};

const MorphingDialogContext = React.createContext<MorphingDialogContextType | null>(null);

function useMorphingDialog() {
	const context = useContext(MorphingDialogContext);
	if (!context) {
		throw new Error("useMorphingDialog must be used within a MorphingDialogProvider");
	}
	return context;
}

export type MorphingDialogProviderProps = {
	children: React.ReactNode;
	transition?: Transition;
};

function MorphingDialogProvider({ children, transition }: MorphingDialogProviderProps) {
	const [isOpen, setIsOpen] = useState(false);
	const uniqueId = useId();
	const triggerRef = useRef<HTMLDivElement>(null!);

	const contextValue = useMemo(
		() => ({
			isOpen,
			setIsOpen,
			uniqueId,
			triggerRef,
		}),
		[isOpen, uniqueId]
	);

	return (
		<MorphingDialogContext.Provider value={contextValue}>
			<MotionConfig transition={transition}>{children}</MotionConfig>
		</MorphingDialogContext.Provider>
	);
}

export type MorphingDialogProps = {
	children: React.ReactNode;
	transition?: Transition;
};

function MorphingDialog({ children, transition }: MorphingDialogProps) {
	return (
		<MorphingDialogProvider>
			<MotionConfig transition={transition}>{children}</MotionConfig>
		</MorphingDialogProvider>
	);
}

export type MorphingDialogTriggerProps = {
	children: React.ReactNode;
	className?: string;
	style?: React.CSSProperties;
	triggerRef?: React.RefObject<HTMLDivElement>;
};

function MorphingDialogTrigger({ children, className, style, triggerRef }: MorphingDialogTriggerProps) {
	const { setIsOpen, isOpen, uniqueId } = useMorphingDialog();

	const handleClick = useCallback(() => {
		setIsOpen(!isOpen);
	}, [isOpen, setIsOpen]);

	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent) => {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				setIsOpen(!isOpen);
			}
		},
		[isOpen, setIsOpen]
	);

	return (
		<motion.div
			aria-controls={`motion-ui-morphing-dialog-content-${uniqueId}`}
			aria-expanded={isOpen}
			aria-haspopup="dialog"
			aria-label={`Open dialog ${uniqueId}`}
			className={cn("relative cursor-pointer", className)}
			layoutId={`dialog-${uniqueId}`}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			ref={triggerRef}
			role="button"
			style={style}
		>
			{children}
		</motion.div>
	);
}

export type MorphingDialogContentProps = {
	children: React.ReactNode;
	className?: string;
	style?: React.CSSProperties;
};

function MorphingDialogContent({ children, className, style }: MorphingDialogContentProps) {
	const { setIsOpen, isOpen, uniqueId, triggerRef } = useMorphingDialog();
	const containerRef = useRef<HTMLDivElement>(null!);
	const [firstFocusableElement, setFirstFocusableElement] = useState<HTMLElement | null>(null);
	const [lastFocusableElement, setLastFocusableElement] = useState<HTMLElement | null>(null);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setIsOpen(false);
			}
			if (event.key === "Tab") {
				if (!(firstFocusableElement && lastFocusableElement)) return;

				if (event.shiftKey) {
					if (document.activeElement === firstFocusableElement) {
						event.preventDefault();
						lastFocusableElement.focus();
					}
				} else if (document.activeElement === lastFocusableElement) {
					event.preventDefault();
					firstFocusableElement.focus();
				}
			}
		};

		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [setIsOpen, firstFocusableElement, lastFocusableElement]);

	useEffect(() => {
		if (isOpen) {
			document.body.classList.add("overflow-hidden");
			const focusableElements = containerRef.current?.querySelectorAll(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
			);
			if (focusableElements && focusableElements.length > 0) {
				setFirstFocusableElement(focusableElements[0] as HTMLElement);
				setLastFocusableElement(focusableElements[focusableElements.length - 1] as HTMLElement);
				(focusableElements[0] as HTMLElement).focus();
			}
		} else {
			document.body.classList.remove("overflow-hidden");
			triggerRef.current?.focus();
		}
	}, [isOpen, triggerRef]);

	useClickOutside(containerRef, () => {
		if (isOpen) {
			setIsOpen(false);
		}
	});

	return (
		<motion.div
			aria-describedby={`motion-ui-morphing-dialog-description-${uniqueId}`}
			aria-labelledby={`motion-ui-morphing-dialog-title-${uniqueId}`}
			aria-modal="true"
			className={cn("overflow-hidden", className)}
			layoutId={`dialog-${uniqueId}`}
			ref={containerRef}
			role="dialog"
			style={{
				willChange: "transform",
				backfaceVisibility: "hidden",
				...style,
			}}
			transition={layoutTransition}
		>
			{children}
		</motion.div>
	);
}

export type MorphingDialogContainerProps = {
	children: React.ReactNode;
	className?: string;
	style?: React.CSSProperties;
};

function MorphingDialogContainer({ children }: MorphingDialogContainerProps) {
	const { isOpen } = useMorphingDialog();

	return (
		<>
			<AnimatePresence>
				{isOpen && (
					<>
						<motion.div
							animate="visible"
							className="fixed inset-0 z-50 bg-black/80"
							exit="exit"
							initial="hidden"
							variants={backdropVariants}
						/>
						<div className="fixed top-0 left-0 z-50 grid h-full w-full place-items-center overflow-y-auto p-6">
							<motion.div
								animate="visible"
								className="w-full max-w-lg"
								exit="exit"
								initial="hidden"
								variants={modalVariants}
							>
								{children}
							</motion.div>
						</div>
					</>
				)}
			</AnimatePresence>
		</>
	);
}

export type MorphingDialogTitleProps = {
	children: React.ReactNode;
	className?: string;
	style?: React.CSSProperties;
};

function MorphingDialogTitle({ children, className, style }: MorphingDialogTitleProps) {
	const { uniqueId } = useMorphingDialog();

	return (
		<motion.div
			className={className}
			layout
			layoutId={`dialog-title-container-${uniqueId}`}
			style={{
				willChange: "transform",
				backfaceVisibility: "hidden",
				...style,
			}}
			transition={{
				duration: 0.3,
				ease: [0.4, 0, 0.2, 1],
				layout: { duration: 0.3 },
			}}
		>
			{children}
		</motion.div>
	);
}

export type MorphingDialogSubtitleProps = {
	children: React.ReactNode;
	className?: string;
	style?: React.CSSProperties;
};

function MorphingDialogSubtitle({ children, className, style }: MorphingDialogSubtitleProps) {
	const { uniqueId } = useMorphingDialog();

	return (
		<motion.div
			className={className}
			layoutId={`dialog-subtitle-container-${uniqueId}`}
			style={{
				willChange: "transform",
				backfaceVisibility: "hidden",
				...style,
			}}
			transition={{
				duration: 0.3,
				ease: [0.4, 0, 0.2, 1],
				layout: { duration: 0.3 },
			}}
		>
			{children}
		</motion.div>
	);
}

export type MorphingDialogDescriptionProps = {
	children: React.ReactNode;
	className?: string;
	disableLayoutAnimation?: boolean;
	variants?: {
		initial: Variant;
		animate: Variant;
		exit: Variant;
	};
};

function MorphingDialogDescription({
	children,
	className,
	variants,
	disableLayoutAnimation,
}: MorphingDialogDescriptionProps) {
	const { uniqueId } = useMorphingDialog();

	const defaultVariants = {
		initial: { opacity: 0, y: 20, scale: 0.95 },
		animate: { opacity: 1, y: 0, scale: 1 },
		exit: { opacity: 0, y: -20, scale: 0.95 },
	};

	return (
		<motion.div
			animate="animate"
			className={className}
			exit="exit"
			id={`dialog-description-${uniqueId}`}
			initial="initial"
			key={`dialog-description-${uniqueId}`}
			layoutId={disableLayoutAnimation ? undefined : `dialog-description-content-${uniqueId}`}
			style={{
				willChange: "transform",
				backfaceVisibility: "hidden",
			}}
			transition={{
				duration: 0.3,
				ease: [0.4, 0, 0.2, 1],
				layout: { duration: 0.3 },
			}}
			variants={variants || defaultVariants}
		>
			{children}
		</motion.div>
	);
}

export type MorphingDialogImageProps = {
	src: string;
	alt: string;
	className?: string;
	style?: React.CSSProperties;
};

function MorphingDialogImage({ src, alt, className, style }: MorphingDialogImageProps) {
	const { uniqueId } = useMorphingDialog();

	return (
		<motion.img alt={alt} className={cn(className)} layoutId={`dialog-img-${uniqueId}`} src={src} style={style} />
	);
}

export type MorphingDialogCloseProps = {
	children?: React.ReactNode;
	className?: string;
	variants?: {
		initial: Variant;
		animate: Variant;
		exit: Variant;
	};
};

function MorphingDialogClose({ children, className, variants }: MorphingDialogCloseProps) {
	const { setIsOpen, uniqueId } = useMorphingDialog();

	const handleClose = useCallback(() => {
		setIsOpen(false);
	}, [setIsOpen]);

	return (
		<motion.button
			animate="animate"
			aria-label="Close dialog"
			className={cn("absolute top-6 right-6", className)}
			exit="exit"
			initial="initial"
			key={`dialog-close-${uniqueId}`}
			onClick={handleClose}
			type="button"
			variants={variants}
		>
			{children || <XIcon size={24} />}
		</motion.button>
	);
}

export {
	MorphingDialog,
	MorphingDialogTrigger,
	MorphingDialogContainer,
	MorphingDialogContent,
	MorphingDialogClose,
	MorphingDialogTitle,
	MorphingDialogSubtitle,
	MorphingDialogDescription,
	MorphingDialogImage,
};
