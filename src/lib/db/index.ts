import { drizzle } from 'drizzle-orm/postgres-js';
import { env } from '@/lib/env.mjs';

export const db = drizzle(env.DATABASE_URL!);
