"use client";

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const themeOptions = [
	{
		icon: SunIcon,
		label: "Light",
		value: "light",
	},
	{
		icon: MoonIcon,
		label: "Dark",
		value: "dark",
	},
	{
		icon: MonitorIcon,
		label: "System",
		value: "system",
	},
] as const;

export function ThemeMenuItems({ showLabel = true }: { showLabel?: boolean }) {
	const { setTheme, theme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const selectedTheme = mounted ? (theme ?? "system") : "system";

	return (
		<>
			{showLabel ? <DropdownMenuLabel>Theme</DropdownMenuLabel> : null}
			<DropdownMenuRadioGroup
				onValueChange={(value) => setTheme(value)}
				value={selectedTheme}
			>
				{themeOptions.map(({ icon: Icon, label, value }) => (
					<DropdownMenuRadioItem
						className="gap-2"
						key={value}
						value={value}
					>
						<Icon className="size-4" />
						{label}
					</DropdownMenuRadioItem>
				))}
			</DropdownMenuRadioGroup>
		</>
	);
}

export function ModeToggle() {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button size="icon" variant="ghost">
					<SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
					<MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
					<span className="sr-only">Toggle theme</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<ThemeMenuItems />
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
