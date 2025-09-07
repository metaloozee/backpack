"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { Loader } from "@/components/ui/loader";
import { useTRPC } from "@/lib/trpc/trpc";
import { cn } from "@/lib/utils";

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
	const trimmedQuery = query.trim().toLowerCase();

	const loadMoreRef = useRef<HTMLDivElement | null>(null);

	const currentChatId = pathname.startsWith("/c/") ? pathname.split("/")[2] : null;

	const infiniteQuery = useInfiniteQuery({
		...trpc.chat.getChats.infiniteQueryOptions({ limit }, { getNextPageParam: (lastPage) => lastPage.nextCursor }),
	});

	const loadedChats = infiniteQuery.data?.pages.flatMap((p) => p.chats) ?? [];

	const filteredLoadedChats = useMemo(() => {
		if (!trimmedQuery) {
			return loadedChats;
		}
		return loadedChats.filter((chat) => chat.title.toLowerCase().includes(trimmedQuery));
	}, [loadedChats, trimmedQuery]);

	const shouldSearchDatabase = trimmedQuery.length > 0 && filteredLoadedChats.length === 0;

	const databaseSearchQuery = useQuery({
		...trpc.chat.searchChats.queryOptions({ query: trimmedQuery, limit: 50 }),
		enabled: shouldSearchDatabase,
	});

	const isSearching = trimmedQuery.length > 0;
	const showingDatabaseResults = shouldSearchDatabase && databaseSearchQuery.data;

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

		const root = sentinel.closest('[data-slot="scroll-area-viewport"]') as Element | null;

		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				if (entry.isIntersecting && infiniteQuery.hasNextPage && !infiniteQuery.isFetchingNextPage) {
					infiniteQuery.fetchNextPage();
				}
			},
			{
				root,
				rootMargin: "200px",
				threshold: 0.1,
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
		chatsToShow = showingDatabaseResults ? (databaseSearchQuery.data?.chats ?? []) : filteredLoadedChats;
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
				<p className="text-muted-foreground">{isSearching ? "No results found" : "No chats"}</p>
			)}

			{chatsToShow.map((c) => {
				const isActive = c.id === currentChatId;
				return (
					<Link
						className={cn("rounded px-2 py-1 hover:bg-neutral-900", isActive && "bg-neutral-900")}
						href={`/c/${c.id}`}
						key={c.id}
					>
						{c.title}
					</Link>
				);
			})}

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
