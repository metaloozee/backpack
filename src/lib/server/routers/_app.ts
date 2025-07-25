import { chatRouter } from './chat';
import { router } from '@/lib/server/trpc';
import { spaceRouter } from './space';
import { memoriesRouter } from './memories';

export const appRouter = router({
    chat: chatRouter,
    space: spaceRouter,
    memories: memoriesRouter,
});

export type AppRouter = typeof appRouter;
