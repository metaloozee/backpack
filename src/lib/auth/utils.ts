import type { Session, User } from "better-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from ".";
import { isEmailAllowlisted } from "./allowlist";
import {
	AUTH_REQUIRED_ERROR_MESSAGE,
	UNAPPROVED_AUTH_ERROR_MESSAGE,
} from "./messages";

interface AuthSession {
	session: Session;
	user: User;
}

interface ApprovedAuthAccess {
	status: "approved";
	authSession: AuthSession;
}

interface UnapprovedAuthAccess {
	status: "authenticated_unapproved";
	authSession: AuthSession;
}

interface AnonymousAuthAccess {
	status: "anonymous";
}

export type AuthAccessState =
	| {
			status: AnonymousAuthAccess["status"];
	  }
	| UnapprovedAuthAccess
	| ApprovedAuthAccess;

type NonApprovedAuthAccessState = Exclude<AuthAccessState, ApprovedAuthAccess>;

const SIGN_IN_PATH = "/sign-in";

const createSignInRedirectPath = (errorMessage?: string): string => {
	if (!errorMessage) {
		return SIGN_IN_PATH;
	}

	const searchParams = new URLSearchParams({
		error: errorMessage,
	});

	return `${SIGN_IN_PATH}?${searchParams.toString()}`;
};

const getAuthSession = async (
	requestHeaders?: Headers
): Promise<AuthSession | null> => {
	const resolvedHeaders = requestHeaders ?? (await headers());
	const authSession = await auth.api.getSession({
		headers: resolvedHeaders,
	});

	if (!(authSession?.session && authSession.user?.email)) {
		return null;
	}

	return {
		session: authSession.session as Session,
		user: authSession.user as User,
	};
};

export const getAuthAccessState = async (
	requestHeaders?: Headers
): Promise<AuthAccessState> => {
	const authSession = await getAuthSession(requestHeaders);

	if (!authSession) {
		return { status: "anonymous" };
	}

	if (!(await isEmailAllowlisted(authSession.user.email))) {
		return {
			status: "authenticated_unapproved",
			authSession,
		};
	}

	return {
		status: "approved",
		authSession,
	};
};

export const getAuthRedirectPath = (
	status: NonApprovedAuthAccessState["status"]
): string => {
	return status === "authenticated_unapproved"
		? createSignInRedirectPath(UNAPPROVED_AUTH_ERROR_MESSAGE)
		: SIGN_IN_PATH;
};

export const createAuthErrorResponse = (
	accessState: NonApprovedAuthAccessState
): Response => {
	if (accessState.status === "authenticated_unapproved") {
		return Response.json(
			{
				code: "FORBIDDEN",
				error: UNAPPROVED_AUTH_ERROR_MESSAGE,
			},
			{ status: 403 }
		);
	}

	return Response.json(
		{
			code: "UNAUTHORIZED",
			error: AUTH_REQUIRED_ERROR_MESSAGE,
		},
		{ status: 401 }
	);
};

export const requireApprovedAuthSession = async (
	requestHeaders?: Headers
): Promise<AuthSession> => {
	const accessState = await getAuthAccessState(requestHeaders);

	if (accessState.status !== "approved") {
		redirect(getAuthRedirectPath(accessState.status));
	}

	return accessState.authSession;
};

export const getAuthorizedSession = async (
	requestHeaders?: Headers
): Promise<AuthSession | null> => {
	const accessState = await getAuthAccessState(requestHeaders);

	if (accessState.status !== "approved") {
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
