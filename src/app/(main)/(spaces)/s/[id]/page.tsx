import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { notFound } from "next/navigation";
import { Chat } from "@/components/chat";
import { DEFAULT_MODEL_ID } from "@/lib/ai/defaults";
import { getDefaultToolsState } from "@/lib/ai/tools";
import { getSession, getUser } from "@/lib/auth/utils";
import { db } from "@/lib/db";
import { spaces } from "@/lib/db/schema/app";

export default async function SpacePage({ params }: { params: Promise<{ id: string }> }) {
	const session = await getSession();
	const user = await getUser();

	const { id: spaceId } = await params;
	const chatId = crypto.randomUUID();

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

	const [spaceData] = await db
		.select()
		.from(spaces)
		.where(and(eq(spaces.id, spaceId), eq(spaces.userId, user?.id ?? "")));

	if (!spaceData) {
		return notFound();
	}

	return (
		<div className="mx-20 flex flex-row justify-evenly gap-20">
			<div className="w-full">
				<Chat
					autoResume={true}
					env={{
						inSpace: true,
						spaceId: spaceData.id,
						spaceName: spaceData.spaceTitle,
						spaceDescription: spaceData.spaceDescription ?? undefined,
						spaceCustomInstructions: spaceData.spaceCustomInstructions ?? undefined,
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
			{/* <div className="mt-20 flex w-full max-w-lg flex-col gap-10">
				<div className="flex w-full flex-col items-end justify-end gap-2">
					<h1 className="w-full text-right text-3xl">{spaceData.spaceTitle}</h1>
					<p className="w-full text-right text-muted-foreground text-xs">{spaceData.spaceDescription}</p>
				</div>
				<div className="flex w-full flex-col items-start justify-start space-y-4">
					<Dialog>
						<DialogTrigger className="!bg-neutral-900/50 flex w-full items-center justify-start gap-3 rounded-md border-2 px-6 py-4 text-left">
							<SettingsIcon className="size-5 text-muted-foreground" />
							Settings
						</DialogTrigger>
						<DialogContent className="bg-neutral-950">
							<DialogTitle>Settings</DialogTitle>
							<p>coming soon...</p>
						</DialogContent>
					</Dialog>

				</div>
			</div> */}
		</div>
	);
}
