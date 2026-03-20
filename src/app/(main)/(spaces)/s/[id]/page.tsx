import { notFound } from "next/navigation";
import { Chat } from "@/components/chat";
import { getSession, getUser } from "@/lib/auth/utils";
import { getSpaceByIdAndUserId } from "@/lib/db/queries";
import { getServerPrefs } from "@/lib/store/server-prefs";
export default async function SpacePage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const session = await getSession();
	const user = await getUser();

	const { id: spaceId } = await params;
	const chatId = crypto.randomUUID();

	const { modelId, mode, selectedAgent, tools, mcpServers } =
		await getServerPrefs();

	const spaceData = await getSpaceByIdAndUserId({
		spaceId,
		userId: user?.id ?? "",
	});

	if (!spaceData) {
		return notFound();
	}

	return (
		<div className="flex h-full min-h-0 w-full flex-1 flex-col">
			<Chat
				autoResume={true}
				env={{
					inSpace: true,
					spaceId: spaceData.id,
					spaceName: spaceData.spaceTitle,
					spaceDescription: spaceData.spaceDescription ?? undefined,
					spaceCustomInstructions:
						spaceData.spaceCustomInstructions ?? undefined,
				}}
				id={chatId}
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
