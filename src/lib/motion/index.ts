import type { Transition, Variants } from "motion/react";

// Emil Kowalski's custom cubic-bezier curves for premium feel
export const easings = {
	// Starts fast, feels responsive
	easeOut: [0.23, 1, 0.32, 1] as const,
	// Natural acceleration/deceleration for morphing/on-screen movement
	easeInOut: [0.77, 0, 0.175, 1] as const,
	// Elegant iOS-like drawer ease
	easeDrawer: [0.32, 0.72, 0, 1] as const,
	// Smooth gentle transition
	gentle: [0.25, 0.1, 0.25, 1] as const,
} as const;

// snappy UI durations (always under 300ms)
export const durations = {
	instant: 0.1,
	fast: 0.15,
	normal: 0.2,
	slow: 0.3,
} as const;

// Transition objects combining easing and duration
export const transitions = {
	instant: {
		duration: durations.instant,
		ease: easings.easeOut,
	} as Transition,
	fast: {
		duration: durations.fast,
		ease: easings.easeOut,
	} as Transition,
	normal: {
		duration: durations.normal,
		ease: easings.easeOut,
	} as Transition,
	slow: {
		duration: durations.slow,
		ease: easings.easeOut,
	} as Transition,
	smooth: {
		duration: durations.normal,
		ease: easings.easeInOut,
	} as Transition,
} as const;

// Spring physics configurations
export const springs = {
	// Crisp, snappy UI spring
	snappy: {
		type: "spring",
		stiffness: 260,
		damping: 24,
	} as Transition,
	// Gentle, soft motion spring
	gentle: {
		type: "spring",
		stiffness: 120,
		damping: 14,
	} as Transition,
	// Apple-style interactive spring
	interactive: {
		type: "spring",
		duration: 0.4,
		bounce: 0.15,
	} as Transition,
} as const;

// Standard variant presets
export const fadeVariants: Variants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: transitions.normal,
	},
	exit: {
		opacity: 0,
		transition: transitions.fast,
	},
};

// Workspace slide-in and scale-in transition
export const workspaceVariants: Variants = {
	hidden: {
		opacity: 0,
		x: "100%",
		scale: 0.98,
	},
	visible: {
		opacity: 1,
		x: 0,
		scale: 1,
		transition: {
			x: { duration: durations.slow, ease: easings.easeOut },
			scale: { duration: durations.slow, ease: easings.easeOut },
			opacity: { duration: durations.normal, ease: easings.easeOut },
		},
	},
	exit: {
		opacity: 0,
		x: "100%",
		scale: 0.98,
		transition: {
			x: { duration: durations.fast, ease: easings.easeInOut },
			scale: { duration: durations.fast, ease: easings.easeInOut },
			opacity: { duration: durations.fast, ease: easings.easeInOut },
		},
	},
};

// Crossfade variants with micro-scale (never scale from 0)
export const contentVariants: Variants = {
	hidden: {
		opacity: 0,
		scale: 0.99,
		filter: "blur(2px)",
	},
	visible: {
		opacity: 1,
		scale: 1,
		filter: "blur(0px)",
		transition: {
			duration: durations.fast,
			ease: easings.easeOut,
		},
	},
	exit: {
		opacity: 0,
		scale: 0.99,
		filter: "blur(2px)",
		transition: {
			duration: durations.instant,
			ease: easings.easeOut,
		},
	},
};

// Stagger variants for list entries (e.g. diff toolbar selectors)
export const staggerContainerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.04,
			delayChildren: 0.02,
		},
	},
	exit: {
		opacity: 0,
		transition: {
			staggerChildren: 0.02,
			staggerDirection: -1,
		},
	},
};

// Staggered list items
export const staggerItemVariants = {
	hidden: {
		opacity: 0,
		y: 6,
	},
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			duration: durations.normal,
			ease: easings.easeOut,
		},
	},
	exit: {
		opacity: 0,
		y: -4,
		transition: {
			duration: durations.fast,
			ease: easings.easeOut,
		},
	},
};

// Legacy compatibility & refined premium variants
export const slideVariants = {
	up: {
		hidden: { opacity: 0, y: 8 },
		visible: {
			opacity: 1,
			y: 0,
			transition: transitions.normal,
		},
		exit: {
			opacity: 0,
			y: -6,
			transition: transitions.fast,
		},
	},
	down: {
		hidden: { opacity: 0, y: -8 },
		visible: {
			opacity: 1,
			y: 0,
			transition: transitions.normal,
		},
		exit: {
			opacity: 0,
			y: 6,
			transition: transitions.fast,
		},
	},
	left: {
		hidden: { opacity: 0, x: -8 },
		visible: {
			opacity: 1,
			x: 0,
			transition: transitions.normal,
		},
		exit: {
			opacity: 0,
			x: -6,
			transition: transitions.fast,
		},
	},
	right: {
		hidden: { opacity: 0, x: 8 },
		visible: {
			opacity: 1,
			x: 0,
			transition: transitions.normal,
		},
		exit: {
			opacity: 0,
			x: 6,
			transition: transitions.fast,
		},
	},
} as const;

export const scaleVariants: Variants = {
	hidden: {
		opacity: 0,
		scale: 0.97,
	},
	visible: {
		opacity: 1,
		scale: 1,
		transition: transitions.normal,
	},
	exit: {
		opacity: 0,
		scale: 0.98,
		transition: transitions.fast,
	},
};

export const staggerVariants = {
	container: staggerContainerVariants,
	item: staggerItemVariants,
};

export const modalVariants: Variants = {
	hidden: {
		opacity: 0,
		scale: 0.98,
		y: 6,
	},
	visible: {
		opacity: 1,
		scale: 1,
		y: 0,
		transition: transitions.normal,
	},
	exit: {
		opacity: 0,
		scale: 0.98,
		y: -4,
		transition: transitions.fast,
	},
};

export const backdropVariants: Variants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: transitions.normal,
	},
	exit: {
		opacity: 0,
		transition: transitions.fast,
	},
};

export const layoutTransition: Transition = {
	duration: durations.normal,
	ease: easings.easeOut,
	layout: {
		duration: durations.normal,
		ease: easings.easeOut,
	},
};

export const hoverVariants: Variants = {
	rest: { scale: 1 },
	hover: {
		scale: 1.015,
		transition: transitions.fast,
	},
	tap: {
		scale: 0.97,
		transition: transitions.instant,
	},
};

export const buttonVariants = hoverVariants;

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
		scale: 0.92,
		transition: transitions.instant,
	},
	spin: {
		rotate: 360,
		transition: {
			duration: 0.8,
			ease: "linear" as const,
			repeat: Number.POSITIVE_INFINITY,
		} as const,
	},
};

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
			y: 6,
		},
		visible: {
			opacity: 1,
			y: 0,
			transition: transitions.normal,
		},
	},
};

export const sidebarVariants = {
	expanded: {
		width: "auto",
		transition: transitions.normal,
	},
	collapsed: {
		width: "auto",
		transition: transitions.normal,
	},
};

export const copyVariants = {
	initial: {
		opacity: 0,
		scale: 0.9,
		rotate: -4,
	},
	animate: {
		opacity: 1,
		scale: 1,
		rotate: 0,
		transition: transitions.normal,
	},
	exit: {
		opacity: 0,
		scale: 0.95,
		rotate: 4,
		transition: transitions.fast,
	},
};

export const rippleVariants = {
	initial: {
		scale: 0,
		opacity: 0.4,
	},
	animate: {
		scale: 2,
		opacity: 0,
		transition: {
			duration: 0.45,
			ease: "easeOut",
		},
	},
};

export const messageVariants = {
	hidden: {
		opacity: 0,
		y: 8,
		scale: 0.99,
	},
	visible: {
		opacity: 1,
		y: 0,
		scale: 1,
		transition: transitions.normal,
	},
	exit: {
		opacity: 0,
		y: -6,
		scale: 0.99,
		transition: transitions.fast,
	},
};

export const loadingVariants = {
	spin: {
		rotate: 360,
		transition: {
			duration: 0.8,
			ease: "linear",
			repeat: Number.POSITIVE_INFINITY,
		},
	},
	pulse: {
		scale: [1, 1.03, 1],
		transition: {
			duration: 1.2,
			ease: "easeInOut",
			repeat: Number.POSITIVE_INFINITY,
		},
	},
	bounce: {
		y: [0, -4, 0],
		transition: {
			duration: 0.5,
			ease: "easeInOut",
			repeat: Number.POSITIVE_INFINITY,
		},
	},
};

export const createPageTransition = (
	direction: "up" | "down" | "left" | "right" = "up"
) => ({
	initial: slideVariants[direction].hidden,
	animate: slideVariants[direction].visible,
	exit: slideVariants[direction].exit,
});

export const createStaggeredList = (staggerDelay = 0.04) => ({
	container: {
		...staggerContainerVariants,
		visible: {
			...staggerContainerVariants.visible,
			transition: {
				staggerChildren: staggerDelay,
				delayChildren: 0.05,
			},
		},
	},
	item: staggerItemVariants,
});
