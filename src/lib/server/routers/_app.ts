import { chatRouter } from './chat';
import { router } from '@/lib/server/trpc';
import { spaceRouter } from './space';

export const appRouter = router({
    chat: chatRouter,
    space: spaceRouter,
});

export type AppRouter = typeof appRouter;
