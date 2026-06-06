import { cookies } from "next/headers";
import { PREFS_COOKIE_NAME, parsePrefsCookie } from "@/lib/store/prefs-codec";
import type { UserPrefs } from "./types";

export const getChatRequestPrefs = async (): Promise<UserPrefs> => {
	const cookieStore = await cookies();
	const prefs = parsePrefsCookie(cookieStore.get(PREFS_COOKIE_NAME)?.value);

	return {
		modelId: prefs.modelId,
		mode: prefs.mode,
		selectedAgent: prefs.selectedAgent,
		toolsState: prefs.tools,
		mcpServersState: prefs.mcpServers,
	};
};
