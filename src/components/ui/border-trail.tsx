"use client";
import { motion, type Transition } from "motion/react";
import { cn } from "@/lib/utils";

export type BorderTrailProps = {
	className?: string;
	size?: number;
	transition?: Transition;
	onAnimationComplete?: () => void;
	style?: React.CSSProperties;
};

export function BorderTrail({ className, size = 60, transition, onAnimationComplete, style }: BorderTrailProps) {
	const defaultTransition: Transition = {
		repeat: Number.POSITIVE_INFINITY,
		duration: 5,
		ease: [0.4, 0, 0.2, 1],
	};

	return (
		<div className="pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]">
			<motion.div
				animate={{
					offsetDistance: ["0%", "100%"],
				}}
				className={cn("absolute aspect-square bg-neutral-500", className)}
				onAnimationComplete={onAnimationComplete}
				style={{
					width: size,
					offsetPath: `rect(0 auto auto 0 round ${size}px)`,
					willChange: "offset-distance",
					...style,
				}}
				transition={transition || defaultTransition}
			/>
		</div>
	);
}
