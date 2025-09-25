"use client";

import { BackpackIcon, LibraryIcon, MessageCirclePlusIcon, PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import UserProfile from "@/components/profile";
import { SidebarChatsList } from "@/components/sidebar/chats-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, useSidebar } from "@/components/ui/sidebar";
import { fadeVariants, iconVariants, slideVariants, transitions } from "@/lib/animations";
import { cn } from "@/lib/utils";

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Function is complex
export function AppSidebar() {
	const pathname = usePathname();

	const isHome = pathname === "/";
	const isSpaces = pathname.startsWith("/s");
	// const isChats = pathname.startsWith("/c");
	const [chatQuery, setChatQuery] = useState("");

	const { state, open, setOpen } = useSidebar();

	return (
		<Sidebar collapsible="icon" variant="floating">
			<SidebarHeader
				className={cn(
					"flex w-full justify-center py-4",
					state === "expanded" ? "items-start px-4" : "items-center px-2"
				)}
			>
				<AnimatePresence mode="wait">
					{state === "expanded" ? (
						<Link className="w-full" href={"/"}>
							<motion.div
								animate="visible"
								className="flex w-full items-center justify-center gap-2"
								exit="exit"
								initial="hidden"
								key="expanded"
								transition={transitions.smooth}
								variants={fadeVariants}
							>
								<motion.div initial="rest" variants={iconVariants} whileHover="hover" whileTap="tap">
									<BackpackIcon className="size-4" />
								</motion.div>
								<h2 className="font-light text-lg">backpack</h2>
							</motion.div>
						</Link>
					) : (
						<Link href={"/"}>
							<motion.div
								animate="visible"
								exit="exit"
								initial="hidden"
								key="collapsed"
								transition={transitions.smooth}
								variants={fadeVariants}
							>
								<motion.div initial="rest" variants={iconVariants} whileHover="hover" whileTap="tap">
									<BackpackIcon className="size-4" />
								</motion.div>
							</motion.div>
						</Link>
					)}
				</AnimatePresence>
			</SidebarHeader>
			<SidebarContent>
				<motion.div
					animate="visible"
					className={cn(
						"flex h-full w-full flex-col gap-2",
						state === "expanded" ? "px-4" : "items-center justify-center"
					)}
					initial="hidden"
					transition={transitions.smooth}
					variants={slideVariants.left}
				>
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
							variant={isHome ? "default" : "outline"}
						>
							<Link href={"/"}>
								{state === "expanded" ? (
									<>
										<motion.div initial="rest" variants={iconVariants} whileHover="hover">
											<MessageCirclePlusIcon />
										</motion.div>
										<p className="font-light">New Chat</p>
									</>
								) : (
									<motion.div initial="rest" variants={iconVariants} whileHover="hover">
										<MessageCirclePlusIcon />
									</motion.div>
								)}
							</Link>
						</Button>
					</motion.div>

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
							variant={isSpaces ? "default" : "outline"}
						>
							<Link href={"/s/"}>
								{state === "expanded" ? (
									<>
										<motion.div initial="rest" variants={iconVariants} whileHover="hover">
											<LibraryIcon />
										</motion.div>
										<p className="font-light">Spaces</p>
									</>
								) : (
									<motion.div initial="rest" variants={iconVariants} whileHover="hover">
										<LibraryIcon />
									</motion.div>
								)}
							</Link>
						</Button>
					</motion.div>

					{state === "expanded" && (
						<Input
							className="!bg-neutral-950 h-8 border-0"
							onChange={(e) => setChatQuery(e.target.value)}
							placeholder="Search chats..."
							value={chatQuery}
						/>
					)}

					{state === "expanded" && (
						<ScrollArea className="h-full w-full flex-1 rounded-md bg-background">
							<SidebarChatsList limit={20} query={chatQuery} showMore={true} />
							<ScrollBar orientation="vertical" />
						</ScrollArea>
					)}
				</motion.div>
			</SidebarContent>
			<SidebarFooter className={cn("w-full", state === "collapsed" ? "flex items-center justify-center" : "p-4")}>
				<motion.div className="w-full" initial="rest" whileHover="hover" whileTap="tap">
					<Button
						className="w-full"
						onClick={() => setOpen(!open)}
						size={state === "collapsed" ? "icon" : "default"}
						variant={"outline"}
					>
						{state === "expanded" ? (
							<>
								<PanelLeftCloseIcon className="size-4 text-muted-foreground" />
								<p className="text-muted-foreground text-xs">Close Panel</p>
							</>
						) : (
							<PanelLeftOpenIcon className="size-3" />
						)}
					</Button>
				</motion.div>

				<Separator className={cn(state === "expanded" ? "my-2" : "my-0")} />
				<UserProfile state={state} />
			</SidebarFooter>
		</Sidebar>
	);
}
