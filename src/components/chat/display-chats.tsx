/** biome-ignore-all lint/suspicious/noArrayIndexKey: Skeleton loading states have static, non-reordering items */
"use client";

import {
	useInfiniteQuery,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { ChevronsDownIcon, Trash2Icon } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "timeago.js";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
	buttonVariants,
	fadeVariants,
	messageVariants,
	modalVariants,
	staggerVariants,
	transitions,
} from "@/lib/animations";
import type { Chat } from "@/lib/db/schema/app";
import { useTRPC } from "@/lib/trpc/trpc";
import { cn } from "@/lib/utils";
import { Spinner } from "../spinner";

interface ChatCardProps {
	chat: Chat;
	isDeleting: boolean;
	onDelete: (chatId: string) => Promise<void>;
}

function ChatCard({ chat, isDeleting, onDelete }: ChatCardProps) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<motion.div
			animate="visible"
			className={cn(
				"relative w-full rounded-md border border-border/80 bg-card px-3 py-2 transition-colors duration-200 dark:border-white/10 dark:bg-black",
				"flex items-center justify-between"
			)}
			exit="exit"
			initial="hidden"
			key={chat.id}
			layout
			transition={transitions.smooth}
			variants={messageVariants}
			whileHover={{ scale: 1.01 }}
			whileTap={{ scale: 0.99 }}
		>
			<Link
				aria-label={`Open chat ${chat.title}`}
				className="absolute inset-0"
				href={`/c/${chat.id}`}
			>
				<span className="sr-only">Open chat {chat.title}</span>
			</Link>

			<motion.div
				animate="visible"
				className="pointer-events-none relative flex min-w-0 flex-1 flex-col items-start justify-start gap-1"
				initial="hidden"
				variants={fadeVariants}
			>
				<p className="w-full truncate">{chat.title}</p>

				<p className="w-full truncate text-muted-foreground text-xs">
					Created {format(chat.createdAt)}
				</p>
			</motion.div>

			<Dialog onOpenChange={setIsOpen} open={isOpen}>
				<DialogTrigger asChild>
					<motion.div
						className="pointer-events-auto relative z-10"
						initial="rest"
						variants={buttonVariants}
						whileHover="hover"
						whileTap="tap"
					>
						<Button
							className="pointer-events-auto relative z-10"
							size={"icon"}
							variant={"ghost"}
						>
							<Trash2Icon className="size-3 text-muted-foreground" />
						</Button>
					</motion.div>
				</DialogTrigger>
				<DialogContent>
					<motion.div
						animate="visible"
						exit="exit"
						initial="hidden"
						variants={modalVariants}
					>
						<DialogHeader className="space-y-5">
							<motion.div
								animate="visible"
								className="space-y-2"
								initial="hidden"
								variants={staggerVariants.container}
							>
								<motion.div variants={staggerVariants.item}>
									<DialogTitle>
										Are you absolutely sure?
									</DialogTitle>
								</motion.div>
								<motion.div variants={staggerVariants.item}>
									<DialogDescription className="text-sm">
										This action cannot be undone. This will
										permanently delete your chat and remove
										your data from our servers.
									</DialogDescription>
								</motion.div>
							</motion.div>

							<motion.div
								animate="visible"
								className="flex w-full flex-row-reverse gap-2"
								initial="hidden"
								variants={staggerVariants.container}
							>
								<motion.div variants={staggerVariants.item}>
									<motion.div
										initial="rest"
										whileHover="hover"
										whileTap="tap"
									>
										<Button
											className="text-xs"
											disabled={isDeleting}
											onClick={async (e) => {
												e.preventDefault();
												try {
													await onDelete(chat.id);
													setIsOpen(false);
												} catch {
													/* handled via toast */
												}
											}}
											variant={"destructive"}
										>
											<motion.div
												animate="visible"
												className="flex w-full items-center justify-center gap-2"
												initial="hidden"
												variants={fadeVariants}
											>
												{isDeleting ? (
													<Spinner size="sm" />
												) : (
													<>delete</>
												)}
											</motion.div>
										</Button>
									</motion.div>
								</motion.div>
								<motion.div variants={staggerVariants.item}>
									<motion.div
										initial="rest"
										whileHover="hover"
										whileTap="tap"
									>
										<Button
											className="text-xs"
											onClick={() => setIsOpen(!isOpen)}
											variant={"link"}
										>
											<motion.div
												animate="visible"
												className="flex w-full items-center justify-center gap-2"
												initial="hidden"
												variants={fadeVariants}
											>
												cancel
											</motion.div>
										</Button>
									</motion.div>
								</motion.div>
							</motion.div>
						</DialogHeader>
					</motion.div>
				</DialogContent>
			</Dialog>
		</motion.div>
	);
}

export default function DisplayChats({ spaceId }: { spaceId?: string }) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const [pendingChatId, setPendingChatId] = useState<string | null>(null);

	const deleteMutation = useMutation(
		trpc.chat.deleteChat.mutationOptions({
			onMutate: ({ chatId }) => {
				setPendingChatId(chatId);
			},
			onSuccess: async () => {
				await queryClient.invalidateQueries(
					trpc.chat.getChats.pathFilter()
				);

				await queryClient.invalidateQueries(
					trpc.chat.searchChats.pathFilter()
				);
				toast.success("Chat deleted");
			},
			onError: (error) => {
				toast.error("Failed to delete chat", {
					description: error.message,
				});
			},
			onSettled: () => {
				setPendingChatId(null);
			},
		})
	);

	const query = useInfiniteQuery(
		trpc.chat.getChats.infiniteQueryOptions(
			{
				limit: spaceId ? 2 : 5,
				spaceId,
			},
			{
				getNextPageParam: (lastPage) => lastPage.nextCursor,
			}
		)
	);
	const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
		query;

	const chats = data?.pages.flatMap((page) => page.chats) ?? [];

	if (status === "pending") {
		return (
			<>
				{Array.from({ length: spaceId ? 1 : 3 }).map((_, index) => (
					<motion.div
						animate="visible"
						className="relative flex w-full items-center justify-between rounded-lg border border-border/50 bg-card/70 p-4 dark:bg-neutral-900/50"
						initial="hidden"
						key={`skeleton-${index}`}
						variants={messageVariants}
					>
						<div className="flex w-full flex-col items-start justify-start gap-2">
							<Skeleton className="h-4 w-3/4" />
							<Skeleton className="h-3 w-1/2" />
						</div>
						<Skeleton className="h-8 w-8 rounded-md" />
					</motion.div>
				))}
			</>
		);
	}

	return (
		<>
			{chats.map((chat) => (
				<ChatCard
					chat={chat}
					isDeleting={
						pendingChatId === chat.id && deleteMutation.isPending
					}
					key={chat.id}
					onDelete={async (chatId) => {
						await deleteMutation.mutateAsync({ chatId });
					}}
				/>
			))}

			{hasNextPage && (
				<motion.div
					className="flex w-full items-center justify-center"
					variants={buttonVariants}
				>
					<Button
						className="text-muted-foreground text-sm hover:cursor-pointer"
						onClick={() => fetchNextPage()}
						variant={"ghost"}
					>
						<motion.div
							animate="visible"
							className="flex w-full items-center justify-center gap-2 text-xs"
							initial="hidden"
							variants={fadeVariants}
						>
							{isFetchingNextPage ? (
								<Spinner size="sm" />
							) : (
								<>
									<ChevronsDownIcon className="size-4 text-muted-foreground" />
									load more
								</>
							)}
						</motion.div>
					</Button>
				</motion.div>
			)}
		</>
	);
}
