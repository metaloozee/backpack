import { Chat } from "@/components/chat";
import { getServerPrefs } from "@/lib/store/server-prefs";
import { requireApprovedAuthSession } from "@/lib/utils/auth";

export default async function IndexPage() {
	const { session } = await requireApprovedAuthSession();

	const id = crypto.randomUUID();
	const { modelId, mode, selectedAgent, tools, mcpServers } =
		await getServerPrefs();

	return (
		<div className="flex min-h-0 w-full flex-1 flex-col">
			<Chat
				env={{ inSpace: false }}
				id={id}
				initialAgent={selectedAgent ?? undefined}
				initialMcpServers={mcpServers}
				initialMessages={[]}
				initialMode={mode}
				initialModel={modelId}
				initialTools={tools}
				key={id}
				session={session}
			/>
		</div>
	);
}
