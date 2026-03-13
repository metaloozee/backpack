"use client";

import { BackpackIcon } from "lucide-react";
import Link from "next/link";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function MobileHeader() {
	return (
		<header className="sticky top-0 z-40 flex items-center justify-between border-border/40 border-b bg-background/80 px-4 py-3 backdrop-blur-sm md:hidden dark:border-white/5 dark:bg-neutral-950/80">
			<SidebarTrigger className="-ml-1" />
			<Link className="flex items-center gap-2" href="/">
				<BackpackIcon className="size-4" />
				<span className="font-light text-base">backpack</span>
			</Link>
			{/* Spacer to keep the brand centered */}
			<div className="size-7 shrink-0" />
		</header>
	);
}
