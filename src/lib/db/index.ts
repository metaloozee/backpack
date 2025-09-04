/** biome-ignore-all lint/performance/noNamespaceImport: false positive */

import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import { env } from "@/lib/env.mjs";
import * as app from "./schema/app";
import * as auth from "./schema/auth";

export const db = drizzle({
	connection: env.DATABASE_URL,
	schema: {
		...auth,
		...app,
	},
	ws,
});
