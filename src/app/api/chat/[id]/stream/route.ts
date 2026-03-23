import { UI_MESSAGE_STREAM_HEADERS } from "ai";
import { after } from "next/server";
import { createResumableStreamContext } from "resumable-stream";
import { caller } from "@/lib/trpc/server";

export async function GET(
	_: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const chat = await caller.chat.getChatById({ chatId: id });

	if (chat.activeStreamId == null) {
		return new Response(null, { status: 204 });
	}

	const streamContext = createResumableStreamContext({ waitUntil: after });

	return new Response(
		await streamContext.resumeExistingStream(chat.activeStreamId),
		{ headers: UI_MESSAGE_STREAM_HEADERS }
	);
}
