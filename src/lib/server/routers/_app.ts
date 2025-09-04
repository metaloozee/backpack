import { router } from "@/lib/server/trpc";
import { chatRouter } from "./chat";
import { memoriesRouter } from "./memories";
import { spaceRouter } from "./space";

export const appRouter = router({
	chat: chatRouter,
	space: spaceRouter,
	memories: memoriesRouter,
});

export type AppRouter = typeof appRouter;
