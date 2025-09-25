"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc/trpc";

const PLACEHOLDER_SPACE_ID = "00000000-0000-0000-0000-000000000000";

export function useSpaceOverview(spaceId?: string, enabled = true) {
	const trpc = useTRPC();
	const shouldFetch = Boolean(enabled && spaceId);

	const query = useQuery({
		...trpc.space.getSpaceOverview.queryOptions({
			// biome-ignore lint/style/noNonNullAssertion: spaceId is guaranteed to be set if enabled is true
			spaceId: shouldFetch ? spaceId! : PLACEHOLDER_SPACE_ID,
		}),
		enabled: shouldFetch,
		staleTime: 30_000,
	});

	return {
		...query,
		data: shouldFetch ? query.data : undefined,
		status: (shouldFetch ? query.status : "success") as typeof query.status,
	};
}
