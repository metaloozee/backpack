import { Transition, Variants } from 'motion/react';

// Base easing curves for smooth animations
export const easings = {
    smooth: [0.4, 0, 0.2, 1] as const,
    bouncy: [0.68, -0.55, 0.265, 1.55] as const,
    snappy: [0.25, 0.46, 0.45, 0.94] as const,
    gentle: [0.25, 0.1, 0.25, 1] as const,
} as const;

// Standard durations
export const durations = {
    fast: 0.15,
    normal: 0.25,
    slow: 0.4,
    slower: 0.6,
} as const;

// Base transitions
export const transitions = {
    smooth: {
        duration: durations.normal,
        ease: easings.smooth,
    },
    fast: {
        duration: durations.fast,
        ease: easings.smooth,
    },
    slow: {
        duration: durations.slow,
        ease: easings.gentle,
    },
    bouncy: {
        duration: durations.normal,
        ease: easings.bouncy,
    },
    spring: {
        type: 'spring' as const,
        stiffness: 260,
        damping: 20,
    },
    gentleSpring: {
        type: 'spring' as const,
        stiffness: 120,
        damping: 14,
    },
} as const;

// Fade animations
export const fadeVariants: Variants = {
    hidden: {
        opacity: 0,
    },
    visible: {
        opacity: 1,
        transition: transitions.smooth,
    },
    exit: {
        opacity: 0,
        transition: transitions.fast,
    },
};

// Slide animations
export const slideVariants = {
    up: {
        hidden: {
            opacity: 0,
            y: 20,
        },
        visible: {
            opacity: 1,
            y: 0,
            transition: transitions.smooth,
        },
        exit: {
            opacity: 0,
            y: -10,
            transition: transitions.fast,
        },
    },
    down: {
        hidden: {
            opacity: 0,
            y: -20,
        },
        visible: {
            opacity: 1,
            y: 0,
            transition: transitions.smooth,
        },
        exit: {
            opacity: 0,
            y: 10,
            transition: transitions.fast,
        },
    },
    left: {
        hidden: {
            opacity: 0,
            x: -20,
        },
        visible: {
            opacity: 1,
            x: 0,
            transition: transitions.smooth,
        },
        exit: {
            opacity: 0,
            x: -10,
            transition: transitions.fast,
        },
    },
    right: {
        hidden: {
            opacity: 0,
            x: 20,
        },
        visible: {
            opacity: 1,
            x: 0,
            transition: transitions.smooth,
        },
        exit: {
            opacity: 0,
            x: 10,
            transition: transitions.fast,
        },
    },
} as const;

// Scale animations
export const scaleVariants: Variants = {
    hidden: {
        opacity: 0,
        scale: 0.95,
    },
    visible: {
        opacity: 1,
        scale: 1,
        transition: transitions.smooth,
    },
    exit: {
        opacity: 0,
        scale: 0.98,
        transition: transitions.fast,
    },
};

// Stagger animations for lists
export const staggerVariants = {
    container: {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
                delayChildren: 0.1,
            },
        },
        exit: {
            opacity: 0,
            transition: {
                staggerChildren: 0.02,
                staggerDirection: -1,
            },
        },
    },
    item: {
        hidden: {
            opacity: 0,
            y: 10,
        },
        visible: {
            opacity: 1,
            y: 0,
            transition: transitions.smooth,
        },
        exit: {
            opacity: 0,
            y: -5,
            transition: transitions.fast,
        },
    },
};

// Modal/Dialog animations
export const modalVariants: Variants = {
    hidden: {
        opacity: 0,
        scale: 0.96,
        y: 10,
    },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: transitions.smooth,
    },
    exit: {
        opacity: 0,
        scale: 0.98,
        y: -5,
        transition: transitions.fast,
    },
};

// Backdrop animations
export const backdropVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: transitions.smooth,
    },
    exit: {
        opacity: 0,
        transition: transitions.fast,
    },
};

// Layout animations
export const layoutTransition: Transition = {
    duration: durations.normal,
    ease: easings.smooth,
    layout: {
        duration: durations.normal,
        ease: easings.smooth,
    },
};

// Hover animations
export const hoverVariants = {
    rest: { scale: 1 },
    hover: {
        scale: 1.02,
        transition: transitions.fast,
    },
    tap: {
        scale: 0.98,
        transition: transitions.fast,
    },
};

// Button animations
export const buttonVariants = {
    rest: { scale: 1 },
    hover: {
        scale: 1.02,
        transition: transitions.fast,
    },
    tap: {
        scale: 0.98,
        transition: transitions.fast,
    },
};

// Icon animations
export const iconVariants: Variants = {
    rest: {
        scale: 1,
        rotate: 0,
    },
    hover: {
        scale: 1.1,
        transition: transitions.fast,
    },
    tap: {
        scale: 0.9,
        transition: transitions.fast,
    },
    spin: {
        rotate: 360,
        transition: {
            duration: 1,
            ease: 'linear' as any,
            repeat: Infinity as any,
        } as any,
    },
};

// Text animation variants for smooth text effects
export const textVariants = {
    container: {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.02,
                delayChildren: 0.05,
            },
        },
    },
    item: {
        hidden: {
            opacity: 0,
            y: 10,
        },
        visible: {
            opacity: 1,
            y: 0,
            transition: transitions.smooth,
        },
    },
};

// Sidebar animations
export const sidebarVariants = {
    expanded: {
        width: 'auto',
        transition: transitions.smooth,
    },
    collapsed: {
        width: 'auto',
        transition: transitions.smooth,
    },
};

// Copy success animation
export const copyVariants = {
    initial: {
        opacity: 0,
        scale: 0.8,
        rotate: -5,
    },
    animate: {
        opacity: 1,
        scale: 1,
        rotate: 0,
        transition: transitions.smooth,
    },
    exit: {
        opacity: 0,
        scale: 0.9,
        rotate: 5,
        transition: transitions.fast,
    },
};

// Ripple effect for buttons
export const rippleVariants = {
    initial: {
        scale: 0,
        opacity: 0.6,
    },
    animate: {
        scale: 2,
        opacity: 0,
        transition: {
            duration: 0.6,
            ease: 'easeOut',
        },
    },
};

// Message animations
export const messageVariants = {
    hidden: {
        opacity: 0,
        y: 15,
        scale: 0.98,
    },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: transitions.smooth,
    },
    exit: {
        opacity: 0,
        y: -10,
        scale: 0.98,
        transition: transitions.fast,
    },
};

// Loading animations
export const loadingVariants = {
    spin: {
        rotate: 360,
        transition: {
            duration: 1,
            ease: 'linear',
            repeat: Infinity,
        },
    },
    pulse: {
        scale: [1, 1.05, 1],
        transition: {
            duration: 1.5,
            ease: 'easeInOut',
            repeat: Infinity,
        },
    },
    bounce: {
        y: [0, -5, 0],
        transition: {
            duration: 0.6,
            ease: 'easeInOut',
            repeat: Infinity,
        },
    },
};

// Helper function to create consistent page transitions
export const createPageTransition = (direction: 'up' | 'down' | 'left' | 'right' = 'up') => ({
    initial: slideVariants[direction].hidden,
    animate: slideVariants[direction].visible,
    exit: slideVariants[direction].exit,
});

// Helper function for staggered list animations
export const createStaggeredList = (staggerDelay: number = 0.05) => ({
    container: {
        ...staggerVariants.container,
        visible: {
            ...staggerVariants.container.visible,
            transition: {
                staggerChildren: staggerDelay,
                delayChildren: 0.1,
            },
        },
    },
    item: staggerVariants.item,
});
