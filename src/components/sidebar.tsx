"use client";

import type { LucideIcon } from "lucide-react";
import {
	BackpackIcon,
	LibraryIcon,
	MessageCirclePlusIcon,
	PanelLeftCloseIcon,
	PanelLeftOpenIcon,
	XIcon,
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

function DesktopSidebarBrand({ state }: { state: "expanded" | "collapsed" }) {
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

function DesktopSidebarNavButton({
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

function DesktopSidebarContent({
	chatQuery,
	isHome,
	isSpaces,
	open,
	setChatQuery,
	setOpen,
	state,
}: {
	chatQuery: string;
	isHome: boolean;
	isSpaces: boolean;
	open: boolean;
	setChatQuery: (value: string) => void;
	setOpen: (open: boolean) => void;
	state: "expanded" | "collapsed";
}) {
	return (
		<>
			<DesktopSidebarBrand state={state} />
			<SidebarContent>
				<motion.div
					animate="visible"
					className={cn(
						"flex h-full w-full flex-col gap-2",
						state === "expanded"
							? "px-4"
							: "items-center justify-center"
					)}
					initial="hidden"
					transition={transitions.smooth}
					variants={slideVariants.left}
				>
					<DesktopSidebarNavButton
						active={isHome}
						href="/"
						icon={MessageCirclePlusIcon}
						label="New Chat"
						state={state}
					/>
					<DesktopSidebarNavButton
						active={isSpaces}
						href="/s/"
						icon={LibraryIcon}
						label="Spaces"
						state={state}
					/>

					{state === "expanded" ? (
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

					{state === "expanded" ? (
						<ScrollArea className="h-full w-full flex-1 rounded-md bg-background">
							<SidebarChatsList
								limit={20}
								query={chatQuery}
								showMore={true}
							/>
							<ScrollBar orientation="vertical" />
						</ScrollArea>
					) : null}
				</motion.div>
			</SidebarContent>
			<SidebarFooter
				className={cn(
					"w-full",
					state === "collapsed"
						? "flex items-center justify-center"
						: "p-4"
				)}
			>
				<motion.div
					className="w-full"
					initial="rest"
					whileHover="hover"
					whileTap="tap"
				>
					<Button
						aria-label={
							state === "expanded"
								? "Close sidebar"
								: "Open sidebar"
						}
						className="w-full"
						onClick={() => setOpen(!open)}
						size={state === "collapsed" ? "icon" : "default"}
						variant="outline"
					>
						{state === "expanded" ? (
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
					className={cn(state === "expanded" ? "my-2" : "my-0")}
				/>
				<UserProfile state={state} />
			</SidebarFooter>
		</>
	);
}

function MobileSidebarContent({
	chatQuery,
	isHome,
	isSpaces,
	setChatQuery,
	setOpenMobile,
}: {
	chatQuery: string;
	isHome: boolean;
	isSpaces: boolean;
	setChatQuery: (value: string) => void;
	setOpenMobile: (open: boolean) => void;
}) {
	return (
		<>
			<SidebarHeader className="mobile-safe-top gap-4 border-sidebar-border border-b px-4 pt-4 pb-3">
				<div className="flex items-center justify-between gap-3">
					<Link className="min-w-0 flex-1" href="/">
						<div className="flex items-center gap-2">
							<BackpackIcon className="size-4 shrink-0" />
							<div className="min-w-0">
								<p className="truncate font-light text-lg">
									backpack
								</p>
								<p className="truncate text-muted-foreground text-xs">
									Conversations and spaces
								</p>
							</div>
						</div>
					</Link>
					<Button
						aria-label="Close sidebar"
						className="size-9 shrink-0"
						onClick={() => setOpenMobile(false)}
						size="icon"
						variant="ghost"
					>
						<XIcon className="size-4" />
					</Button>
				</div>
				<div className="grid grid-cols-2 gap-2">
					<Button
						asChild
						className="h-11 justify-start"
						variant={isHome ? "default" : "outline"}
					>
						<Link aria-label="New Chat" href="/">
							<MessageCirclePlusIcon className="size-4" />
							<span className="text-sm">New Chat</span>
						</Link>
					</Button>
					<Button
						asChild
						className="h-11 justify-start"
						variant={isSpaces ? "default" : "outline"}
					>
						<Link aria-label="Spaces" href="/s/">
							<LibraryIcon className="size-4" />
							<span className="text-sm">Spaces</span>
						</Link>
					</Button>
				</div>
				<Input
					autoComplete="off"
					className="h-11 border-sidebar-border bg-background text-sm dark:bg-neutral-950"
					onChange={(event) => setChatQuery(event.target.value)}
					placeholder="Search chats..."
					value={chatQuery}
				/>
			</SidebarHeader>
			<SidebarContent className="px-4 pb-4">
				<ScrollArea
					className="h-full w-full flex-1 rounded-xl bg-background"
					maskHeight={0}
				>
					<SidebarChatsList
						limit={20}
						query={chatQuery}
						showMore={true}
					/>
					<ScrollBar orientation="vertical" />
				</ScrollArea>
			</SidebarContent>
			<SidebarFooter className="mobile-safe-bottom border-sidebar-border border-t px-4 pt-3 pb-4">
				<UserProfile state="expanded" />
			</SidebarFooter>
		</>
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

	useEffect(() => {
		if (!isMobile || pathname.length === 0) {
			return;
		}

		setOpenMobile(false);
	}, [isMobile, pathname, setOpenMobile]);

	return (
		<Sidebar collapsible="icon" variant="floating">
			{isMobile ? (
				<MobileSidebarContent
					chatQuery={chatQuery}
					isHome={isHome}
					isSpaces={isSpaces}
					setChatQuery={setChatQuery}
					setOpenMobile={setOpenMobile}
				/>
			) : (
				<DesktopSidebarContent
					chatQuery={chatQuery}
					isHome={isHome}
					isSpaces={isSpaces}
					open={open}
					setChatQuery={setChatQuery}
					setOpen={setOpen}
					state={state}
				/>
			)}
		</Sidebar>
	);
}
