/** biome-ignore-all lint/a11y/useButtonType: false positive */
/** biome-ignore-all lint/a11y/useSemanticElements: false positive */
/** biome-ignore-all lint/correctness/useJsxKeyInIterable: false positive */
"use client";

import { motion } from "framer-motion";
import { MonitorCogIcon, MoonStarIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import React from "react";
import { cn } from "@/lib/utils";

const THEME_OPTIONS = [
	{
		icon: MonitorCogIcon,
		value: "system",
	},
	{
		icon: SunIcon,
		value: "light",
	},
	{
		icon: MoonStarIcon,
		value: "dark",
	},
];

export function ToggleTheme() {
	const { theme, setTheme } = useTheme();

	const [isMounted, setIsMounted] = React.useState(false);

	React.useEffect(() => {
		setIsMounted(true);
	}, []);

	if (!isMounted) {
		return <div className="flex h-8 w-24" />;
	}

	return (
		<motion.div
			animate={{ opacity: 1 }}
			className="inline-flex w-full items-center justify-between overflow-hidden rounded border bg-neutral-100 dark:bg-neutral-900"
			initial={{ opacity: 0 }}
			key={String(isMounted)}
			role="radiogroup"
			transition={{ duration: 0.3 }}
		>
			{THEME_OPTIONS.map((option) => (
				<button
					aria-checked={theme === option.value}
					aria-label={`Switch to ${option.value} theme`}
					className={cn(
						"relative flex size-7 cursor-pointer items-center justify-center rounded-md transition-all",
						theme === option.value
							? "text-foreground"
							: "text-muted-foreground hover:text-foreground"
					)}
					key={option.value}
					onClick={() => setTheme(option.value)}
					role="radio"
				>
					{theme === option.value && (
						<motion.div
							className="absolute inset-0 rounded border border-neutral-300 dark:border-neutral-700"
							layoutId="theme-option"
							transition={{
								type: "spring",
								bounce: 0.1,
								duration: 0.75,
							}}
						/>
					)}
					<option.icon className="size-3.5" />
				</button>
			))}
		</motion.div>
	);
}
