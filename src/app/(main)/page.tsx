import { Chat } from "@/components/chat";
import { requireApprovedAuthSession } from "@/lib/auth/utils";

import { getServerPrefs } from "@/lib/store/server-prefs";

export default async function IndexPage() {
	const { session } = await requireApprovedAuthSession();

	const id = crypto.randomUUID();
	const { modelId, mode, selectedAgent, tools, mcpServers } =
		await getServerPrefs();

	return (
		<div className="flex min-h-0 w-full flex-1 flex-col">
			<Chat
				autoResume={true}
				env={{ inSpace: false }}
				id={id}
				initialAgent={selectedAgent ?? undefined}
				initialMcpServers={mcpServers}
				initialMessages={[]}
				initialMode={mode}
				initialModel={modelId}
				initialTools={tools}
				session={session}
			/>
		</div>
	);
}
