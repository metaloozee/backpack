"use client";
import { motion } from "motion/react";
import type React from "react";
import type { JSX } from "react";
import { cn } from "@/lib/utils";

export interface TextShimmerProps {
	children: string;
	as?: React.ElementType;
	className?: string;
	duration?: number;
	spread?: number;
}

const motionComponentCache = new Map();

export function TextShimmer({
	children,
	as: Component = "p",
	className,
	duration = 2,
	spread = 2,
}: TextShimmerProps) {
	if (!motionComponentCache.has(Component)) {
		motionComponentCache.set(
			Component,
			motion.create(Component as keyof JSX.IntrinsicElements)
		);
	}
	const MotionComponent = motionComponentCache.get(
		Component
	) as typeof motion.p;

	const dynamicSpread = children.length * spread;

	return (
		<MotionComponent
			animate={{ backgroundPosition: "0% center" }}
			className={cn(
				"relative inline-block bg-[length:250%_100%,auto] bg-clip-text",
				"text-transparent [--base-color:#a1a1aa] [--base-gradient-color:#000]",
				"[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))] [background-repeat:no-repeat,padding-box]",
				"dark:[--base-color:#71717a] dark:[--base-gradient-color:#ffffff] dark:[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))]",
				className
			)}
			initial={{ backgroundPosition: "100% center" }}
			style={
				{
					"--spread": `${dynamicSpread}px`,
					backgroundImage:
						"var(--bg), linear-gradient(var(--base-color), var(--base-color))",
					willChange: "background-position",
				} as React.CSSProperties
			}
			transition={{
				repeat: Number.POSITIVE_INFINITY,
				duration,
				ease: [0.4, 0, 0.2, 1],
			}}
		>
			{children}
		</MotionComponent>
	);
}
