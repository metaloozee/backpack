import { saveChat } from './chat';
import { router } from '@/lib/server/trpc';
import { createSpace } from './space';

export const appRouter = router({
    saveChat: saveChat,
    space: createSpace,
});

export type AppRouter = typeof appRouter;
