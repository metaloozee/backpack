import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Chat as PreviewChat } from "@/components/chat";
import { DEFAULT_MODEL_ID } from "@/lib/ai/defaults";
import { getDefaultToolsState } from "@/lib/ai/tools";
import { convertToUIMessages } from "@/lib/ai/utils";
import { getSession, getUser } from "@/lib/auth/utils";
import {
	getChatByIdAndUserId,
	getMessagesByChatId,
	getSpaceByIdAndUserId,
} from "@/lib/db/queries";

export default async function ChatPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const session = await getSession();
	const user = await getUser();

	const { id: chatId } = await params;

	const cookieStore = await cookies();
	const selectedModel =
		cookieStore.get("X-Model-Id")?.value ?? DEFAULT_MODEL_ID;

	const toolsStateString = cookieStore.get("X-Tools-State")?.value;
	let initialTools = getDefaultToolsState();
	if (toolsStateString) {
		try {
			initialTools = JSON.parse(toolsStateString);
		} catch (_) {
			initialTools = getDefaultToolsState();
		}
	}

	const mcpServersStateString = cookieStore.get("X-MCP-Servers-State")?.value;
	let initialMcpServers = {};
	if (mcpServersStateString) {
		try {
			initialMcpServers = JSON.parse(mcpServersStateString);
		} catch (_) {
			// No action needed
		}
	}

	const initialMode = cookieStore.get("X-Mode-Selection")?.value ?? "ask";
	const initialAgent = cookieStore.get("X-Selected-Agent")?.value;

	const chatData = await getChatByIdAndUserId({
		id: chatId,
		userId: user?.id ?? "",
	});

	if (!chatData) {
		return notFound();
	}

	const spaceData = chatData.spaceId
		? await getSpaceByIdAndUserId({
				spaceId: chatData.spaceId ?? "",
				userId: user?.id ?? "",
			})
		: undefined;

	const messages = await getMessagesByChatId({ id: chatData.id });

	return (
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
			initialAgent={initialAgent}
			initialMcpServers={initialMcpServers}
			initialMessages={convertToUIMessages(messages)}
			initialMode={initialMode}
			initialModel={selectedModel}
			initialTools={initialTools}
			session={session}
		/>
	);
}
