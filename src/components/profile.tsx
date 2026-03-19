"use client";

import { Avatar } from "@radix-ui/react-avatar";
import { LogOutIcon, SettingsIcon, UserIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
	buttonVariants,
	fadeVariants,
	iconVariants,
	slideVariants,
	transitions,
} from "@/lib/animations";
import { authClient } from "@/lib/auth/client";
import { useIsMobile } from "@/lib/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { AvatarFallback, AvatarImage } from "./ui/avatar";

interface UserProfileProps {
	state: "expanded" | "collapsed";
}

function ProfileLoading({ state }: UserProfileProps) {
	return (
		<motion.div
			animate="visible"
			className={cn(
				"flex items-center gap-2",
				state === "collapsed"
					? "justify-center"
					: "w-full justify-start"
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
			{state === "expanded" ? (
				<motion.div
					animate="visible"
					className="h-4 w-20 rounded bg-muted"
					initial="hidden"
					variants={slideVariants.right}
				/>
			) : null}
		</motion.div>
	);
}

function SignedOutProfile({
	onSignIn,
	state,
}: UserProfileProps & {
	onSignIn: () => void;
}) {
	return (
		<motion.div
			className={cn(state === "collapsed" ? "w-9" : "w-full")}
			initial="rest"
			variants={buttonVariants}
			whileHover="hover"
			whileTap="tap"
		>
			<Button
				aria-label={state === "collapsed" ? "Sign in" : undefined}
				className={cn(state === "expanded" ? "w-full" : "")}
				onClick={onSignIn}
				size={state === "collapsed" ? "icon" : "default"}
				variant="outline"
			>
				<motion.div
					initial="rest"
					variants={iconVariants}
					whileHover="hover"
				>
					<UserIcon className="size-4" />
				</motion.div>
				<AnimatePresence>
					{state === "expanded" ? (
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
					) : null}
				</AnimatePresence>
			</Button>
		</motion.div>
	);
}

function SignedInProfile({
	email,
	image,
	isMobile,
	name,
	onAccountSettings,
	onSignOut,
	state,
}: UserProfileProps & {
	email?: string | null;
	image?: string | null;
	isMobile: boolean;
	name?: string | null;
	onAccountSettings: () => void;
	onSignOut: () => void;
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<motion.button
					animate="visible"
					aria-label={
						state === "collapsed"
							? `${name || email || "User"} menu`
							: undefined
					}
					className={cn(
						"flex items-center gap-2 rounded-md p-1 transition-colors hover:bg-accent hover:text-accent-foreground",
						state === "collapsed"
							? "justify-center"
							: "w-full justify-start"
					)}
					initial="hidden"
					type="button"
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
								<AvatarImage
									className="rounded-sm"
									src={image || ""}
								/>
								<AvatarFallback>
									<UserIcon className="size-4 text-primary" />
								</AvatarFallback>
							</Avatar>
						</motion.div>
						<AnimatePresence>
							{state === "expanded" ? (
								<motion.div
									animate="visible"
									className="flex flex-col items-start"
									exit="exit"
									initial="hidden"
									transition={transitions.fast}
									variants={fadeVariants}
								>
									<span className="max-w-[120px] truncate font-medium text-sm">
										{name || "User"}
									</span>
									<span className="max-w-[120px] truncate font-medium text-muted-foreground text-xs">
										{email || "User"}
									</span>
								</motion.div>
							) : null}
						</AnimatePresence>
					</motion.div>
				</motion.button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align={isMobile ? "start" : "end"}
				className="w-48"
				side={isMobile ? "top" : "right"}
				sideOffset={isMobile ? 12 : 10}
			>
				<DropdownMenuItem
					className="cursor-pointer"
					onClick={onAccountSettings}
				>
					<SettingsIcon className="size-4" />
					Account Settings
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<ThemeToggle />
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="cursor-pointer"
					onClick={onSignOut}
				>
					<LogOutIcon className="size-4" />
					Sign Out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export default function UserProfile({ state }: UserProfileProps) {
	const { data: session, isPending } = authClient.useSession();
	const isMobile = useIsMobile();
	const router = useRouter();
	const [isHydrated, setIsHydrated] = useState(false);

	useEffect(() => {
		setIsHydrated(true);
	}, []);

	if (!isHydrated || isPending) {
		return <ProfileLoading state={state} />;
	}

	if (!session) {
		return (
			<SignedOutProfile
				onSignIn={() => router.push("/sign-in")}
				state={state}
			/>
		);
	}

	return (
		<SignedInProfile
			email={session.user?.email}
			image={session.user?.image}
			isMobile={isMobile}
			name={session.user?.name}
			onAccountSettings={() => router.push("/account")}
			onSignOut={() =>
				authClient.signOut({
					fetchOptions: {
						onSuccess: () => {
							router.push("/sign-in");
						},
					},
				})
			}
			state={state}
		/>
	);
}
