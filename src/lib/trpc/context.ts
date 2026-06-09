import { db } from "@/lib/db/index";
import { getAuthAccessState } from "@/lib/utils/auth";

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
