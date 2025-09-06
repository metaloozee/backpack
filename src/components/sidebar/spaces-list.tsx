"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Loader } from "@/components/ui/loader";
import { useTRPC } from "@/lib/trpc/trpc";

export function SidebarSpacesList({ limit = 3 }: { limit?: number }) {
	const trpc = useTRPC();

	const { data, status, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery(
		trpc.space.getSpaces.infiniteQueryOptions({ limit }, { getNextPageParam: (lastPage) => lastPage.nextCursor })
	);

	if (status === "pending") {
		return (
			<div className="flex flex-col gap-1 px-1 py-1 text-muted-foreground text-xs">
				<Loader className="size-3" />
			</div>
		);
	}

	const spaces = data?.pages.flatMap((p) => p.spaces) ?? [];

	return (
		<div className="flex flex-col gap-1 px-1 py-1 text-xs">
			{spaces.length === 0 && <p className="text-muted-foreground">No spaces</p>}
			{spaces.map((s) => (
				<Link className="truncate rounded px-2 py-1 hover:bg-neutral-900/50" href={`/s/${s.id}`} key={s.id}>
					{s.spaceTitle}
				</Link>
			))}
			{hasNextPage && (
				<button
					className="self-start rounded px-2 py-1 text-muted-foreground transition hover:bg-neutral-900/50"
					disabled={isFetchingNextPage}
					onClick={() => fetchNextPage()}
					type="button"
				>
					{isFetchingNextPage ? "Loading..." : "More"}
				</button>
			)}
		</div>
	);
}
