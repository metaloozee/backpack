"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Loader } from "@/components/ui/loader";
import { useTRPC } from "@/lib/trpc/trpc";
import { Button } from "../ui/button";

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

	const { data, status, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery(
		trpc.chat.getChats.infiniteQueryOptions({ limit }, { getNextPageParam: (lastPage) => lastPage.nextCursor })
	);

	if (status === "pending") {
		return (
			<div className="flex flex-col items-center justify-center gap-1 px-1 py-1 text-muted-foreground text-xs">
				<Loader className="size-3" />
			</div>
		);
	}

	const chats = data?.pages.flatMap((p) => p.chats) ?? [];
	const normalizedQuery = query.trim().toLowerCase();
	const filteredChats = normalizedQuery
		? chats.filter((c) => c.title.toLowerCase().includes(normalizedQuery))
		: chats;

	return (
		<div className="flex flex-col justify-center gap-1 rounded-md bg-background px-1 py-1 text-xs">
			{filteredChats.length === 0 && <p className="text-muted-foreground">No chats</p>}
			{filteredChats.map((c) => (
				<Link
					className="max-w-[200px] truncate rounded px-2 py-1 hover:bg-neutral-900/50"
					href={`/c/${c.id}`}
					key={c.id}
				>
					{c.title}
				</Link>
			))}
			{showMore && hasNextPage && (
				<Button
					className="text-xs"
					disabled={isFetchingNextPage}
					onClick={() => fetchNextPage()}
					size={"sm"}
					variant={"ghost"}
				>
					{isFetchingNextPage ? (
						<div className="flex items-center justify-center gap-2">
							<Loader className="size-3" />
							Loading more...
						</div>
					) : (
						"load more"
					)}
				</Button>
			)}
		</div>
	);
}
