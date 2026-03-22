import { type NextRequest, NextResponse } from "next/server";
import { getAuthAccessState, getAuthRedirectPath } from "@/lib/auth/utils";

export async function proxy(request: NextRequest) {
	const accessState = await getAuthAccessState(request.headers);

	if (accessState.status !== "approved") {
		return NextResponse.redirect(
			new URL(getAuthRedirectPath(accessState.status), request.url)
		);
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		"/((?!api|_next/static|_next/image|sign-in|.*\\.png$|\\.well-known/workflow/).*)",
	],
};
