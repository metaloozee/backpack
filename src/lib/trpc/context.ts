import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";

export async function createTRPCContext() {
	const res = await auth.api.getSession({
		headers: await headers(),
	});

	// Normalize session shape for procedures: ensure `session.user` exists when authenticated
	const session = res?.session ? { ...res.session, user: res.user } : null;

	return {
		db,
		session,
	};
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
