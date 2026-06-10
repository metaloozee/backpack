import { router } from "@/lib/server/trpc";
import { artifactRouter } from "./artifact";
import { chatRouter } from "./chat";
import { mcpRouter } from "./mcp";
import { memoriesRouter } from "./memories";
import { spaceRouter } from "./space";

export const appRouter = router({
	artifact: artifactRouter,
	chat: chatRouter,
	mcp: mcpRouter,
	space: spaceRouter,
	memories: memoriesRouter,
});

export type AppRouter = typeof appRouter;
