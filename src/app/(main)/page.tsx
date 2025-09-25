import { cookies } from "next/headers";
import { Chat } from "@/components/chat";
import { DEFAULT_MODEL_ID } from "@/lib/ai/defaults";
import { getDefaultToolsState } from "@/lib/ai/tools";
import { getSession } from "@/lib/auth/utils";

export default async function IndexPage() {
	const session = await getSession();

	const id = crypto.randomUUID();
	const cookieStore = await cookies();
	const selectedModel = cookieStore.get("X-Model-Id")?.value ?? DEFAULT_MODEL_ID;

	const toolsStateString = cookieStore.get("X-Tools-State")?.value;
	let initialTools = getDefaultToolsState();
	if (toolsStateString) {
		try {
			initialTools = JSON.parse(toolsStateString);
		} catch (_) {
			initialTools = getDefaultToolsState();
		}
	}
	const initialMode = cookieStore.get("X-Mode-Selection")?.value ?? "ask";
	const initialAgent = cookieStore.get("X-Selected-Agent")?.value;

	return (
		<div className="flex h-screen w-full flex-col items-center justify-center">
			<Chat
				autoResume={true}
				env={{ inSpace: false }}
				id={id}
				initialAgent={initialAgent}
				initialMessages={[]}
				initialMode={initialMode}
				initialModel={selectedModel}
				initialTools={initialTools}
				session={session}
			/>
		</div>
	);
}
