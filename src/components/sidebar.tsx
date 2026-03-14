"use client";

import type { LucideIcon } from "lucide-react";
import {
	BackpackIcon,
	LibraryIcon,
	MessageCirclePlusIcon,
	PanelLeftCloseIcon,
	PanelLeftOpenIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect } from "react";
import UserProfile from "@/components/profile";
import { SidebarChatsList } from "@/components/sidebar/chats-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	useSidebar,
} from "@/components/ui/sidebar";
import {
	fadeVariants,
	iconVariants,
	slideVariants,
	transitions,
} from "@/lib/animations";
import { cn } from "@/lib/utils";

function SidebarBrand({ state }: { state: "expanded" | "collapsed" }) {
	return (
		<SidebarHeader
			className={cn(
				"flex w-full justify-center py-4",
				state === "expanded" ? "items-start px-4" : "items-center px-2"
			)}
		>
			<AnimatePresence mode="wait">
				{state === "expanded" ? (
					<Link className="w-full" href="/">
						<motion.div
							animate="visible"
							className="flex w-full items-center justify-center gap-2"
							exit="exit"
							initial="hidden"
							key="expanded"
							transition={transitions.smooth}
							variants={fadeVariants}
						>
							<motion.div
								initial="rest"
								variants={iconVariants}
								whileHover="hover"
								whileTap="tap"
							>
								<BackpackIcon className="size-4" />
							</motion.div>
							<h2 className="font-light text-lg">backpack</h2>
						</motion.div>
					</Link>
				) : (
					<Link href="/">
						<motion.div
							animate="visible"
							exit="exit"
							initial="hidden"
							key="collapsed"
							transition={transitions.smooth}
							variants={fadeVariants}
						>
							<motion.div
								initial="rest"
								variants={iconVariants}
								whileHover="hover"
								whileTap="tap"
							>
								<BackpackIcon className="size-4" />
							</motion.div>
						</motion.div>
					</Link>
				)}
			</AnimatePresence>
		</SidebarHeader>
	);
}

function SidebarNavButton({
	active,
	href,
	icon: Icon,
	label,
	state,
}: {
	active: boolean;
	href: string;
	icon: LucideIcon;
	label: string;
	state: "expanded" | "collapsed";
}) {
	return (
		<motion.div
			className={cn(state === "expanded" ? "w-full" : "")}
			initial="rest"
			whileHover="hover"
			whileTap="tap"
		>
			<Button
				asChild
				className={cn(state === "expanded" ? "w-full" : "")}
				size={state === "expanded" ? "default" : "icon"}
				variant={active ? "default" : "outline"}
			>
				<Link aria-label={label} href={href}>
					{state === "expanded" ? (
						<>
							<motion.div
								initial="rest"
								variants={iconVariants}
								whileHover="hover"
							>
								<Icon />
							</motion.div>
							<p className="font-light">{label}</p>
						</>
					) : (
						<motion.div
							initial="rest"
							variants={iconVariants}
							whileHover="hover"
						>
							<Icon />
						</motion.div>
					)}
				</Link>
			</Button>
		</motion.div>
	);
}

export function AppSidebar() {
	const pathname = usePathname();
	const isHome = pathname === "/";
	const isSpaces = pathname.startsWith("/s");
	const [chatQuery, setChatQuery] = useQueryState(
		"chatQuery",
		parseAsString.withDefault("")
	);
	const { isMobile, open, setOpen, setOpenMobile, state } = useSidebar();

	// On mobile, the sidebar renders inside a Sheet (always full-width),
	// so treat state as "expanded" to show labels, search, and chat list.
	const effectiveState = isMobile ? "expanded" : state;

	useEffect(() => {
		if (!isMobile || pathname.length === 0) {
			return;
		}

		setOpenMobile(false);
	}, [isMobile, pathname, setOpenMobile]);

	return (
		<Sidebar collapsible="icon" variant="floating">
			<SidebarBrand state={effectiveState} />
			<SidebarContent>
				<motion.div
					animate="visible"
					className={cn(
						"flex h-full w-full flex-col gap-2",
						effectiveState === "expanded"
							? "px-4"
							: "items-center justify-center"
					)}
					initial="hidden"
					transition={transitions.smooth}
					variants={slideVariants.left}
				>
					<SidebarNavButton
						active={isHome}
						href="/"
						icon={MessageCirclePlusIcon}
						label="New Chat"
						state={effectiveState}
					/>
					<SidebarNavButton
						active={isSpaces}
						href="/s/"
						icon={LibraryIcon}
						label="Spaces"
						state={effectiveState}
					/>

					{effectiveState === "expanded" ? (
						<Input
							autoComplete="off"
							className="h-8 border-0 bg-background dark:bg-neutral-950"
							onChange={(event) =>
								setChatQuery(event.target.value)
							}
							placeholder="Search chats..."
							value={chatQuery}
						/>
					) : null}

					{effectiveState === "expanded" ? (
						<ScrollArea className="h-full w-full flex-1 rounded-md bg-background">
							<SidebarChatsList
								limit={20}
								query={chatQuery}
								showMore
							/>
							<ScrollBar orientation="vertical" />
						</ScrollArea>
					) : null}
				</motion.div>
			</SidebarContent>
			<SidebarFooter
				className={cn(
					"w-full",
					effectiveState === "collapsed"
						? "flex items-center justify-center"
						: "p-4"
				)}
			>
				{!isMobile && (
					<>
						<motion.div
							className="w-full"
							initial="rest"
							whileHover="hover"
							whileTap="tap"
						>
							<Button
								aria-label={
									effectiveState === "expanded"
										? "Close sidebar"
										: "Open sidebar"
								}
								className="w-full"
								onClick={() => setOpen(!open)}
								size={
									effectiveState === "collapsed"
										? "icon"
										: "default"
								}
								variant="outline"
							>
								{effectiveState === "expanded" ? (
									<>
										<PanelLeftCloseIcon className="size-4 text-muted-foreground" />
										<p className="text-muted-foreground text-xs">
											Close Panel
										</p>
									</>
								) : (
									<PanelLeftOpenIcon className="size-3" />
								)}
							</Button>
						</motion.div>
						<Separator
							className={cn(
								effectiveState === "expanded" ? "my-2" : "my-0"
							)}
						/>
					</>
				)}
				<UserProfile state={effectiveState} />
			</SidebarFooter>
		</Sidebar>
	);
}
