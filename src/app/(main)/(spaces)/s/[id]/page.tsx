import { cookies } from "next/headers";

import { notFound } from "next/navigation";
import { Chat } from "@/components/chat";
import { DEFAULT_MODEL_ID } from "@/lib/ai/defaults";
import { getDefaultToolsState } from "@/lib/ai/tools";
import { getSession, getUser } from "@/lib/auth/utils";
import { getSpaceByIdAndUserId } from "@/lib/db/queries";

export default async function SpacePage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const session = await getSession();
	const user = await getUser();

	const { id: spaceId } = await params;
	const chatId = crypto.randomUUID();

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
	const initialMode = cookieStore.get("X-Mode-Selection")?.value ?? "ask";
	const initialAgent = cookieStore.get("X-Selected-Agent")?.value;

	const spaceData = await getSpaceByIdAndUserId({
		spaceId,
		userId: user?.id ?? "",
	});

	if (!spaceData) {
		return notFound();
	}

	return (
		<div className="flex h-full w-full flex-col items-center justify-center">
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
