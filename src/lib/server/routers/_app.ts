import { saveChat } from './chat';
import { computersRouter } from './computers';
import { router } from '@/lib/server/trpc';

export const appRouter = router({
    saveChat: saveChat,
});

export type AppRouter = typeof appRouter;
