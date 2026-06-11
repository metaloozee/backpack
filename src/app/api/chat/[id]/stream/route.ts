import {
	getChatByIdAndUserId,
	setChatActiveStreamId,
} from "@/lib/db/queries/chat";
import { env } from "@/lib/env.mjs";
import { createAuthErrorResponse, getAuthAccessState } from "@/lib/utils/auth";
import { getStreamContext } from "../../_lib/resumable-stream";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	if (!env.REDIS_URL) {
		return new Response(null, { status: 204 });
	}

	const accessState = await getAuthAccessState(request.headers);
	if (accessState.status !== "approved") {
		return createAuthErrorResponse(accessState);
	}

	const { id: chatId } = await params;
	const chat = await getChatByIdAndUserId({
		chatId,
		userId: accessState.authSession.session.userId,
	});

	if (!chat?.activeStreamId) {
		return new Response(null, { status: 204 });
	}

	const streamContext = getStreamContext();
	if (!streamContext) {
		return new Response(null, { status: 204 });
	}

	let stream: ReadableStream<string> | null | undefined;
	try {
		stream = await streamContext.resumeExistingStream(chat.activeStreamId);
	} catch (error) {
		console.error("Failed to resume chat stream", error);
		await setChatActiveStreamId({
			chatId,
			userId: accessState.authSession.session.userId,
			activeStreamId: null,
		});
		return new Response(null, { status: 204 });
	}

	if (!stream) {
		return new Response(null, { status: 204 });
	}

	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream",
		},
	});
}
