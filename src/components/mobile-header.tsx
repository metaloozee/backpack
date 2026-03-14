"use client";

import { BackpackIcon } from "lucide-react";
import Link from "next/link";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useMobileHeader } from "@/lib/mobile-header-context";

export function MobileHeader() {
	const { title, subtitle } = useMobileHeader();

	return (
		<header className="sticky top-0 z-40 flex w-full items-center justify-between border-border/40 border-b bg-background/80 px-4 py-3 backdrop-blur-sm md:hidden dark:border-white/5 dark:bg-neutral-950/80">
			<SidebarTrigger className="-ml-1" />
			{title ? (
				<div className="flex min-w-0 flex-1 flex-col items-center justify-center px-3">
					<span className="max-w-[200px] truncate font-medium text-sm">
						{title}
					</span>
					{subtitle ? (
						<span className="max-w-[200px] truncate text-muted-foreground text-xs">
							{subtitle}
						</span>
					) : null}
				</div>
			) : (
				<Link className="flex items-center gap-2" href="/">
					<BackpackIcon className="size-4" />
					<span className="font-light text-base">backpack</span>
				</Link>
			)}
			{/* Spacer to keep the content centered */}
			<div className="size-7 shrink-0" />
		</header>
	);
}
