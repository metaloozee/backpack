import { notFound } from "next/navigation";
import { Chat as PreviewChat } from "@/components/chat";
import { convertToUIMessages } from "@/lib/ai/utils";
import { requireApprovedAuthSession } from "@/lib/auth/utils";
import { getMessagesByChatId, getSpaceByIdAndUserId } from "@/lib/db/queries";
import { getServerPrefs } from "@/lib/store/server-prefs";
import { caller } from "@/lib/trpc/server";
export default async function ChatPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { session, user } = await requireApprovedAuthSession();

	const { id: chatId } = await params;

	const { modelId, mode, selectedAgent, tools, mcpServers } =
		await getServerPrefs();

	const chatData = await caller.chat.getChatById({
		chatId,
	});

	if (!chatData) {
		return notFound();
	}

	const spaceData = chatData.spaceId
		? await getSpaceByIdAndUserId({
				spaceId: chatData.spaceId ?? "",
				userId: user.id,
			})
		: undefined;

	const messages = await getMessagesByChatId({ id: chatData.id });

	return (
		<div className="flex min-h-0 w-full flex-1 flex-col">
			<PreviewChat
				autoResume={true}
				env={{
					inSpace: !!spaceData,
					spaceId: spaceData ? spaceData.id : undefined,
					spaceName: spaceData ? spaceData.spaceTitle : undefined,
					spaceDescription: spaceData
						? (spaceData.spaceDescription ?? undefined)
						: undefined,
					spaceCustomInstructions: spaceData
						? (spaceData.spaceCustomInstructions ?? undefined)
						: undefined,
				}}
				id={chatId}
				initialAgent={selectedAgent ?? undefined}
				initialMcpServers={mcpServers}
				initialMessages={convertToUIMessages(messages)}
				initialMode={mode}
				initialModel={modelId}
				initialTools={tools}
				session={session}
			/>
		</div>
	);
}
