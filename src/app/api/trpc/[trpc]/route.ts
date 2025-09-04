import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import type { NextRequest } from "next/server";
import { env } from "@/lib/env.mjs";
import { appRouter } from "@/lib/server/routers/_app";
import { createTRPCContext } from "@/lib/trpc/context";

const createContext = () => {
	return createTRPCContext();
};

const handler = (req: NextRequest) =>
	fetchRequestHandler({
		endpoint: "/api/trpc",
		req,
		router: appRouter,
		createContext: () => createContext(),
		onError:
			env.NODE_ENV === "development"
				? ({ path, error }) => {
						// biome-ignore lint: This only runs in development
						console.error(`❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`);
					}
				: undefined,
	});

export { handler as GET, handler as POST };
