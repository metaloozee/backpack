import { type NextRequest, NextResponse } from "next/server";
import { getAuthAccessState } from "@/lib/auth/utils";

export async function proxy(request: NextRequest) {
	const accessState = await getAuthAccessState(request.headers);

	if (accessState.status === "anonymous") {
		return NextResponse.redirect(new URL("/sign-in", request.url));
	}

	if (accessState.status === "unauthorized") {
		return NextResponse.redirect(
			new URL("/sign-in?error=unauthorized", request.url)
		);
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		"/((?!api|_next/static|_next/image|sign-in|.*\\.png$|\\.well-known/workflow/).*)",
	],
};
