import { drizzle } from 'drizzle-orm/neon-serverless';
import { env } from '@/lib/env.mjs';
import ws from 'ws';

import * as auth from './schema/auth';
import * as app from './schema/app';

export const db = drizzle({
    connection: env.DATABASE_URL,
    schema: {
        ...auth,
        ...app,
    },
    ws: ws,
});
