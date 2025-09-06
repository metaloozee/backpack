"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { useTRPC } from "@/lib/trpc/trpc";

export function SidebarSearchChats() {
	const trpc = useTRPC();
	const [query, setQuery] = useState("");
	const [debouncedQuery, setDebouncedQuery] = useState("");

	const onChange = useDebouncedCallback((value: string) => setDebouncedQuery(value), 300);

	const { data, isFetching } = useQuery({
		...trpc.chat.searchChats.queryOptions({ query: debouncedQuery, limit: 10 }),
		enabled: debouncedQuery.length > 0,
	});

	return (
		<div className="flex flex-col gap-2">
			<Input
				className="h-8"
				onChange={(e) => {
					setQuery(e.target.value);
					onChange(e.target.value);
				}}
				placeholder="Search chats..."
				value={query}
			/>
			{isFetching && (
				<div className="px-1 text-muted-foreground text-xs">
					<Loader className="size-3" />
				</div>
			)}
			{debouncedQuery && (
				<div className="flex max-h-40 flex-col gap-1 overflow-auto px-1 py-1 text-xs">
					{(data?.chats ?? []).length === 0 && <p className="text-muted-foreground">No results</p>}
					{data?.chats?.map((c) => (
						<Link
							className="truncate rounded px-2 py-1 hover:bg-neutral-900/50"
							href={`/c/${c.id}`}
							key={c.id}
						>
							{c.title}
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
