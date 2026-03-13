"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

const THEME_COLOR_BY_MODE = {
	dark: "#121212",
	light: "#fafaf9",
} as const;

export function ThemeColorMeta() {
	const { resolvedTheme } = useTheme();

	useEffect(() => {
		const color =
			THEME_COLOR_BY_MODE[resolvedTheme === "dark" ? "dark" : "light"];
		let meta = document.querySelector('meta[name="theme-color"]');

		if (!meta) {
			meta = document.createElement("meta");
			meta.setAttribute("name", "theme-color");
			document.head.append(meta);
		}

		meta.setAttribute("content", color);
	}, [resolvedTheme]);

	return null;
}
