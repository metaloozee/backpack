import type { Session, User } from "better-auth";
import { headers } from "next/headers";
import { auth } from ".";
import { hasConfiguredEmailAllowlist, isEmailAllowlisted } from "./allowlist";

interface AuthSession {
	session: Session;
	user: User;
}

type AuthAccessState =
	| {
			status: "anonymous";
	  }
	| {
			status: "unauthorized";
	  }
	| {
			status: "authorized";
			authSession: AuthSession;
	  };

export const getAuthAccessState = async (
	requestHeaders?: Headers
): Promise<AuthAccessState> => {
	const resolvedHeaders = requestHeaders ?? (await headers());
	const authSession = await auth.api.getSession({
		headers: resolvedHeaders,
	});

	if (!(authSession?.session && authSession.user?.email)) {
		return { status: "anonymous" };
	}

	if (!(await hasConfiguredEmailAllowlist())) {
		return { status: "unauthorized" };
	}

	if (!(await isEmailAllowlisted(authSession.user.email))) {
		return { status: "unauthorized" };
	}

	return {
		status: "authorized",
		authSession: {
			session: authSession.session as Session,
			user: authSession.user as User,
		},
	};
};

export const getAuthorizedSession = async (
	requestHeaders?: Headers
): Promise<AuthSession | null> => {
	const accessState = await getAuthAccessState(requestHeaders);

	if (accessState.status !== "authorized") {
		return null;
	}

	return accessState.authSession;
};

export const getSession = async (): Promise<Session | null> => {
	const authSession = await getAuthorizedSession();
	return authSession?.session ?? null;
};

export const getUser = async (): Promise<User | null> => {
	const authSession = await getAuthorizedSession();
	return authSession?.user ?? null;
};
