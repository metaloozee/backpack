import { cookies } from "next/headers";
import {
	type BackpackPrefs,
	PREFS_COOKIE_NAME,
	parsePrefsCookie,
} from "./prefs-codec";

export async function getServerPrefs(): Promise<BackpackPrefs> {
	const cookieStore = await cookies();
	return parsePrefsCookie(cookieStore.get(PREFS_COOKIE_NAME)?.value);
}
