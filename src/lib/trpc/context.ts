import { getAuthAccessState } from "@/lib/auth/utils";
import { db } from "@/lib/db/index";

export async function createTRPCContext() {
	const accessState = await getAuthAccessState();
	const session =
		accessState.status === "approved"
			? {
					...accessState.authSession.session,
					user: accessState.authSession.user,
				}
			: null;

	return {
		db,
		session,
	};
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
