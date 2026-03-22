import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { db } from "@/lib/db";
import { env } from "@/lib/env.mjs";
import { isEmailAllowlisted } from "./allowlist";
import { UNAPPROVED_AUTH_ERROR_MESSAGE } from "./messages";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
	}),
	socialProviders: {
		google: {
			clientId: env.GOOGLE_CLIENT_ID,
			clientSecret: env.GOOGLE_CLIENT_SECRET,
		},
		github: {
			clientId: env.GITHUB_CLIENT_ID,
			clientSecret: env.GITHUB_CLIENT_SECRET,
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
					if (!(await isEmailAllowlisted(user.email))) {
						throw new APIError("FORBIDDEN", {
							message: UNAPPROVED_AUTH_ERROR_MESSAGE,
						});
					}
				},
			},
		},
	},
});
