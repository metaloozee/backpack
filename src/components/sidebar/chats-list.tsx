"use client";

import {
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { Trash2Icon, XIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Loader } from "@/components/ui/loader";
import {
	type ChatInfiniteData,
	removeChatFromInfiniteData,
} from "@/lib/trpc/cache-utils";
import { useTRPC } from "@/lib/trpc/trpc";
import { cn } from "@/lib/utils";

const DATABASE_SEARCH_LIMIT = 50;
const INTERSECTION_ROOT_MARGIN = "200px";
const INTERSECTION_THRESHOLD = 0.1;

interface ChatItemProps {
	chat: {
		id: string;
		title: string;
	};
	isActive: boolean;
	isConfirming: boolean;
	isPending: boolean;
	onConfirmDelete: () => void;
	onCancelDelete: () => void;
	onDeleteClick: () => void;
}

function ChatItem({
	chat,
	isActive,
	isConfirming,
	isPending,
	onConfirmDelete,
	onCancelDelete,
	onDeleteClick,
}: ChatItemProps) {
	return (
		<ContextMenu onOpenChange={(open) => !open && onCancelDelete()}>
			<ContextMenuTrigger asChild>
				<Link
					className={cn(
						"rounded px-2 py-1 hover:bg-neutral-900",
						isActive && "bg-neutral-900"
					)}
					href={`/c/${chat.id}`}
				>
					{chat.title}
				</Link>
			</ContextMenuTrigger>
			<ContextMenuContent>
				{isConfirming ? (
					<>
						<ContextMenuItem
							disabled={isPending}
							onSelect={(e) => {
								e.preventDefault();
								onConfirmDelete();
							}}
						>
							{isPending ? (
								<Loader className="size-4" />
							) : (
								<Trash2Icon className="size-4" />
							)}
							<span>Confirm delete</span>
						</ContextMenuItem>
						<ContextMenuSeparator />
						<ContextMenuItem
							onSelect={(e) => {
								e.preventDefault();
								onCancelDelete();
							}}
						>
							<XIcon className="size-4" />
							Cancel
						</ContextMenuItem>
					</>
				) : (
					<ContextMenuItem
						onSelect={(e) => {
							e.preventDefault();
							onDeleteClick();
						}}
					>
						<Trash2Icon className="size-4" />
						<span>Delete…</span>
					</ContextMenuItem>
				)}
			</ContextMenuContent>
		</ContextMenu>
	);
}

export function SidebarChatsList({
	limit = 5,
	query = "",
	showMore = true,
}: {
	limit?: number;
	query?: string;
	showMore?: boolean;
}) {
	const trpc = useTRPC();
	const pathname = usePathname();
	const router = useRouter();
	const trimmedQuery = query.trim().toLowerCase();

	const loadMoreRef = useRef<HTMLDivElement | null>(null);
	const [confirmingChatId, setConfirmingChatId] = useState<string | null>(
		null
	);
	const queryClient = useQueryClient();
	const [pendingChatId, setPendingChatId] = useState<string | null>(null);

	const deleteMutation = useMutation(
		trpc.chat.deleteChat.mutationOptions({
			onMutate: ({ chatId }) => {
				setPendingChatId(chatId);
			},
			onSuccess: async (_, { chatId }) => {
				queryClient.setQueriesData(
					trpc.chat.getChats.pathFilter(),
					(old) =>
						removeChatFromInfiniteData(
							old as ChatInfiniteData | undefined,
							chatId
						)
				);
				await queryClient.invalidateQueries(
					trpc.chat.getChats.pathFilter()
				);
				if (trimmedQuery) {
					await queryClient.invalidateQueries(
						trpc.chat.searchChats.pathFilter()
					);
				}
				if (chatId === currentChatId) {
					router.replace("/");
				}
				toast.success("Chat deleted");
			},
			onError: (error) => {
				toast.error("Failed to delete chat", {
					description: error.message,
				});
			},
			onSettled: () => {
				setPendingChatId(null);
				setConfirmingChatId(null);
			},
		})
	);

	const currentChatId = pathname.startsWith("/c/")
		? pathname.split("/")[2]
		: null;

	const infiniteQuery = useInfiniteQuery({
		...trpc.chat.getChats.infiniteQueryOptions(
			{ limit },
			{ getNextPageParam: (lastPage) => lastPage.nextCursor }
		),
	});

	const loadedChats = infiniteQuery.data?.pages.flatMap((p) => p.chats) ?? [];

	const filteredLoadedChats = useMemo(() => {
		if (!trimmedQuery) {
			return loadedChats;
		}
		return loadedChats.filter((chat) =>
			chat.title.toLowerCase().includes(trimmedQuery)
		);
	}, [loadedChats, trimmedQuery]);

	const shouldSearchDatabase =
		trimmedQuery.length > 0 && filteredLoadedChats.length === 0;

	const databaseSearchQuery = useQuery({
		...trpc.chat.searchChats.queryOptions({
			query: trimmedQuery,
			limit: DATABASE_SEARCH_LIMIT,
		}),
		enabled: shouldSearchDatabase,
	});

	const isSearching = trimmedQuery.length > 0;
	const showingDatabaseResults =
		shouldSearchDatabase && databaseSearchQuery.data;

	useEffect(() => {
		if (!showMore) {
			return;
		}
		if (isSearching) {
			return;
		}
		if (!infiniteQuery.hasNextPage) {
			return;
		}

		const sentinel = loadMoreRef.current;
		if (!sentinel) {
			return;
		}

		const root = sentinel.closest(
			'[data-slot="scroll-area-viewport"]'
		) as Element | null;

		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				if (
					entry.isIntersecting &&
					infiniteQuery.hasNextPage &&
					!infiniteQuery.isFetchingNextPage
				) {
					infiniteQuery.fetchNextPage();
				}
			},
			{
				root,
				rootMargin: INTERSECTION_ROOT_MARGIN,
				threshold: INTERSECTION_THRESHOLD,
			}
		);

		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [
		showMore,
		isSearching,
		infiniteQuery.hasNextPage,
		infiniteQuery.isFetchingNextPage,
		infiniteQuery.fetchNextPage,
	]);

	if (infiniteQuery.status === "pending") {
		return (
			<div className="flex flex-col items-center justify-center gap-1 px-1 py-1 text-muted-foreground text-xs">
				<Loader className="size-3" />
			</div>
		);
	}

	let chatsToShow = loadedChats;
	if (isSearching) {
		chatsToShow = showingDatabaseResults
			? (databaseSearchQuery.data?.chats ?? [])
			: filteredLoadedChats;
	}

	return (
		<div className="flex flex-col justify-center gap-1 px-1 py-1 text-xs">
			{shouldSearchDatabase && databaseSearchQuery.isFetching && (
				<div className="flex items-center gap-2 px-1 py-1 text-muted-foreground text-xs">
					<Loader className="size-3" />
					<span>Searching...</span>
				</div>
			)}

			{chatsToShow.length === 0 && !databaseSearchQuery.isFetching && (
				<p className="text-muted-foreground">
					{isSearching ? "No results found" : "No chats"}
				</p>
			)}

			{chatsToShow.map((c) => (
				<ChatItem
					chat={c}
					isActive={c.id === currentChatId}
					isConfirming={confirmingChatId === c.id}
					isPending={
						pendingChatId === c.id && deleteMutation.isPending
					}
					key={c.id}
					onCancelDelete={() => setConfirmingChatId(null)}
					onConfirmDelete={() =>
						deleteMutation.mutate({ chatId: c.id })
					}
					onDeleteClick={() => setConfirmingChatId(c.id)}
				/>
			))}

			{showMore && !isSearching && (
				<div className="h-6" ref={loadMoreRef}>
					{infiniteQuery.isFetchingNextPage && (
						<div className="flex items-center justify-center gap-2 text-muted-foreground">
							<Loader className="size-3" />
							Loading more...
						</div>
					)}
				</div>
			)}
		</div>
	);
}
