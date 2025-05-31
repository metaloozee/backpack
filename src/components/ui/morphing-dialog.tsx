'use client';

import React, { useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, MotionConfig, Transition, Variant } from 'motion/react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { XIcon } from 'lucide-react';
import useClickOutside from '@/hooks/useClickOutside';
import { modalVariants, backdropVariants, transitions, layoutTransition } from '@/lib/animations';

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
        throw new Error('useMorphingDialog must be used within a MorphingDialogProvider');
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

function MorphingDialogTrigger({
    children,
    className,
    style,
    triggerRef,
}: MorphingDialogTriggerProps) {
    const { setIsOpen, isOpen, uniqueId } = useMorphingDialog();

    const handleClick = useCallback(() => {
        setIsOpen(!isOpen);
    }, [isOpen, setIsOpen]);

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setIsOpen(!isOpen);
            }
        },
        [isOpen, setIsOpen]
    );

    return (
        <motion.div
            ref={triggerRef}
            layoutId={`dialog-${uniqueId}`}
            className={cn('relative cursor-pointer', className)}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            style={style}
            role="button"
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            aria-controls={`motion-ui-morphing-dialog-content-${uniqueId}`}
            aria-label={`Open dialog ${uniqueId}`}
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
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
            if (event.key === 'Tab') {
                if (!firstFocusableElement || !lastFocusableElement) return;

                if (event.shiftKey) {
                    if (document.activeElement === firstFocusableElement) {
                        event.preventDefault();
                        lastFocusableElement.focus();
                    }
                } else {
                    if (document.activeElement === lastFocusableElement) {
                        event.preventDefault();
                        firstFocusableElement.focus();
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [setIsOpen, firstFocusableElement, lastFocusableElement]);

    useEffect(() => {
        if (isOpen) {
            document.body.classList.add('overflow-hidden');
            const focusableElements = containerRef.current?.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (focusableElements && focusableElements.length > 0) {
                setFirstFocusableElement(focusableElements[0] as HTMLElement);
                setLastFocusableElement(
                    focusableElements[focusableElements.length - 1] as HTMLElement
                );
                (focusableElements[0] as HTMLElement).focus();
            }
        } else {
            document.body.classList.remove('overflow-hidden');
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
            ref={containerRef}
            layoutId={`dialog-${uniqueId}`}
            className={cn('overflow-hidden', className)}
            style={{
                willChange: 'transform',
                backfaceVisibility: 'hidden',
                ...style,
            }}
            transition={layoutTransition}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`motion-ui-morphing-dialog-title-${uniqueId}`}
            aria-describedby={`motion-ui-morphing-dialog-description-${uniqueId}`}
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
                            className="fixed inset-0 bg-black/80 z-50"
                            variants={backdropVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        />
                        <div className="fixed left-0 top-0 z-50 grid h-full w-full place-items-center overflow-y-auto p-6">
                            <motion.div
                                variants={modalVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="w-full max-w-lg"
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
            layoutId={`dialog-title-container-${uniqueId}`}
            className={className}
            style={{
                willChange: 'transform',
                backfaceVisibility: 'hidden',
                ...style,
            }}
            transition={{
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1],
                layout: { duration: 0.3 },
            }}
            layout
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
            layoutId={`dialog-subtitle-container-${uniqueId}`}
            className={className}
            style={{
                willChange: 'transform',
                backfaceVisibility: 'hidden',
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
            key={`dialog-description-${uniqueId}`}
            layoutId={disableLayoutAnimation ? undefined : `dialog-description-content-${uniqueId}`}
            variants={variants || defaultVariants}
            className={className}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1],
                layout: { duration: 0.3 },
            }}
            style={{
                willChange: 'transform',
                backfaceVisibility: 'hidden',
            }}
            id={`dialog-description-${uniqueId}`}
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
        <motion.img
            src={src}
            alt={alt}
            className={cn(className)}
            layoutId={`dialog-img-${uniqueId}`}
            style={style}
        />
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
            onClick={handleClose}
            type="button"
            aria-label="Close dialog"
            key={`dialog-close-${uniqueId}`}
            className={cn('absolute right-6 top-6', className)}
            initial="initial"
            animate="animate"
            exit="exit"
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
