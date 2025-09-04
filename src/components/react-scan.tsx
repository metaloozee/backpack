"use client";

import { type JSX, useEffect } from "react";
import { scan } from "react-scan";

export function ReactScan(): JSX.Element {
	useEffect(() => {
		scan({
			enabled: true,
		});
	}, []);

	// biome-ignore lint/complexity/noUselessFragments: This is a valid JSX element
	return <></>;
}
