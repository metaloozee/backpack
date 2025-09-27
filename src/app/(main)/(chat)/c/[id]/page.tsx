import { and, asc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Chat as PreviewChat } from "@/components/chat";
import { DEFAULT_MODEL_ID } from "@/lib/ai/defaults";
import { getDefaultToolsState } from "@/lib/ai/tools";
import { convertToUIMessages } from "@/lib/ai/utils";
import { getSession, getUser } from "@/lib/auth/utils";
import { db } from "@/lib/db";
import { chat as DBChat, message as DBMessage, spaces as DBSpace } from "@/lib/db/schema/app";

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: false positive
export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
	const session = await getSession();
	const user = await getUser();

	const { id: chatId } = await params;

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

	const [chatData] = await db
		.select()
		.from(DBChat)
		.where(and(eq(DBChat.id, chatId), eq(DBChat.userId, user?.id ?? "")));

	if (!chatData) {
		return notFound();
	}

	const [spaceData] = chatData.spaceId
		? await db
				.select()
				.from(DBSpace)
				.where(and(eq(DBSpace.id, chatData.spaceId ?? ""), eq(DBSpace.userId, user?.id ?? "")))
				.limit(1)
		: [undefined];

	const messages = await db
		.select()
		.from(DBMessage)
		.where(eq(DBMessage.chatId, chatData.id))
		.orderBy(asc(DBMessage.createdAt));

	return (
		<PreviewChat
			autoResume={true}
			env={{
				inSpace: !!spaceData,
				spaceId: spaceData ? spaceData.id : undefined,
				spaceName: spaceData ? spaceData.spaceTitle : undefined,
				spaceDescription: spaceData ? (spaceData.spaceDescription ?? undefined) : undefined,
				spaceCustomInstructions: spaceData ? (spaceData.spaceCustomInstructions ?? undefined) : undefined,
			}}
			id={chatId}
			initialAgent={initialAgent}
			initialMessages={convertToUIMessages(messages)}
			initialMode={initialMode}
			initialModel={selectedModel}
			initialTools={initialTools}
			session={session}
		/>
	);
}
