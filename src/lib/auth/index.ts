import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { db } from "@/lib/db";
import { env } from "@/lib/env.mjs";
import { hasConfiguredEmailAllowlist, isEmailAllowlisted } from "./allowlist";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
	}),
	socialProviders: {
		github: {
			clientId: env.GITHUB_CLIENT_ID as string,
			clientSecret: env.GITHUB_CLIENT_SECRET as string,
		},
	},
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60,
		},
	},
	databaseHooks: {
		user: {
			create: {
				before: async (user) => {
					await Promise.resolve();

					if (!(await hasConfiguredEmailAllowlist())) {
						throw new APIError("FORBIDDEN", {
							message:
								"No approved accounts have been configured.",
						});
					}

					if (!(await isEmailAllowlisted(user.email))) {
						throw new APIError("FORBIDDEN", {
							message:
								"Your account is not approved for this release.",
						});
					}
				},
			},
		},
	},
});
