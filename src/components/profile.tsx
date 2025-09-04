"use client";

import { Avatar } from "@radix-ui/react-avatar";
import { LogOutIcon, SettingsIcon, UserIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buttonVariants, fadeVariants, iconVariants, slideVariants, transitions } from "@/lib/animations";
import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import { AvatarFallback, AvatarImage } from "./ui/avatar";

type UserProfileProps = {
	state: "expanded" | "collapsed";
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Function is complex
export default function UserProfile({ state }: UserProfileProps) {
	const { data: session, isPending } = authClient.useSession();
	const router = useRouter();

	const handleAccountSettings = () => {
		router.push("/account");
	};

	const handleSignOut = () => {
		authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					router.push("/sign-in");
				},
			},
		});
	};

	if (isPending) {
		return (
			<motion.div
				animate="visible"
				className={cn(
					"flex items-center gap-2",
					state === "collapsed" ? "justify-center" : "w-full justify-start"
				)}
				initial="hidden"
				variants={fadeVariants}
			>
				<motion.div
					animate="pulse"
					className="h-8 w-8 rounded-full bg-muted"
					initial="rest"
					variants={iconVariants}
				/>
				{state === "expanded" && (
					<motion.div
						animate="visible"
						className="h-4 w-20 rounded bg-muted"
						initial="hidden"
						variants={slideVariants.right}
					/>
				)}
			</motion.div>
		);
	}

	if (!session) {
		return (
			<motion.div
				className={cn(state === "collapsed" ? "w-9" : "w-full")}
				initial="rest"
				variants={buttonVariants}
				whileHover="hover"
				whileTap="tap"
			>
				<Button
					className={cn(state === "expanded" ? "w-full" : "")}
					onClick={() => router.push("/sign-in")}
					size={state === "collapsed" ? "icon" : "default"}
					variant="outline"
				>
					<motion.div initial="rest" variants={iconVariants} whileHover="hover">
						<UserIcon className="size-4" />
					</motion.div>
					<AnimatePresence>
						{state === "expanded" && (
							<motion.span
								animate="visible"
								className="text-sm"
								exit="exit"
								initial="hidden"
								transition={transitions.fast}
								variants={fadeVariants}
							>
								Sign In
							</motion.span>
						)}
					</AnimatePresence>
				</Button>
			</motion.div>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<motion.div
					animate="visible"
					className={cn(
						"flex cursor-pointer items-center gap-2 rounded-md p-1 transition-colors hover:bg-accent hover:text-accent-foreground",
						state === "collapsed" ? "justify-center" : "w-full justify-start"
					)}
					initial="hidden"
					variants={fadeVariants}
				>
					<motion.div
						animate="visible"
						className="flex items-center gap-2"
						initial="hidden"
						variants={slideVariants.right}
					>
						<motion.div
							className="flex size-8 items-center justify-center rounded-full border border-border/50 bg-primary/10"
							initial="rest"
							variants={iconVariants}
							whileHover="hover"
						>
							<Avatar>
								<AvatarImage className="rounded-sm" src={session.user?.image || ""} />
								<AvatarFallback>
									<UserIcon className="size-4 text-primary" />
								</AvatarFallback>
							</Avatar>
						</motion.div>
						<AnimatePresence>
							{state === "expanded" && (
								<motion.div
									animate="visible"
									className="flex flex-col"
									exit="exit"
									initial="hidden"
									transition={transitions.fast}
									variants={fadeVariants}
								>
									<span className="max-w-[120px] truncate font-medium text-sm">
										{session.user?.name || "User"}
									</span>
									<span className="max-w-[120px] truncate font-medium text-muted-foreground text-xs">
										{session.user?.email || "User"}
									</span>
								</motion.div>
							)}
						</AnimatePresence>
					</motion.div>
				</motion.div>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-48" side="right" sideOffset={10}>
				<DropdownMenuItem asChild className="cursor-pointer" onClick={handleAccountSettings}>
					<Button className="w-full justify-start p-0" variant="ghost">
						<SettingsIcon className="size-4" />
						Account Settings
					</Button>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild className="cursor-pointer" onClick={handleSignOut}>
					<Button className="w-full justify-start p-0" variant="ghost">
						<LogOutIcon className="size-4" />
						Sign Out
					</Button>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
