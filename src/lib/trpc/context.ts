import { getAuthorizedSession } from "@/lib/auth/utils";
import { db } from "@/lib/db/index";

export async function createTRPCContext() {
	const res = await getAuthorizedSession();

	const session = res?.session ? { ...res.session, user: res.user } : null;

	return {
		db,
		session,
	};
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
