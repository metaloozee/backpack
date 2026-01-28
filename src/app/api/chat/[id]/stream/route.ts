import { createUIMessageStream, JsonToSseTransformStream } from "ai";
import { differenceInSeconds } from "date-fns";
import type { ChatMessage } from "@/lib/ai/types";
import { getSession } from "@/lib/auth/utils";
import {
	getChatByIdAndUserId,
	getLatestMessageByChatId,
	getLatestStreamIdByChatId,
} from "@/lib/db/queries";
import { getStreamContext } from "../../route";

const SECONDS_PER_MINUTE = 60;

export async function GET(
	_: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id: chatId } = await params;

	const streamContext = getStreamContext();
	const resumeRequestedAt = new Date();

	if (!streamContext) {
		return new Response(null, { status: 204 });
	}

	if (!chatId) {
		return new Response(
			JSON.stringify({
				code: "BAD_REQUEST",
				cause: "chatId is required",
			}),
			{
				status: 400,
			}
		);
	}

	const session = await getSession();
	if (!session) {
		return new Response(
			JSON.stringify({ code: "UNAUTHORIZED", cause: "Unauthorized" }),
			{
				status: 401,
			}
		);
	}

	let chat: Awaited<ReturnType<typeof getChatByIdAndUserId>>;

	try {
		chat = await getChatByIdAndUserId({
			id: chatId,
			userId: session.userId,
		});
	} catch (_error) {
		return new Response(
			JSON.stringify({
				code: "INTERNAL_SERVER_ERROR",
				cause: "Internal server error",
			}),
			{ status: 500 }
		);
	}

	if (!chat) {
		return new Response(
			JSON.stringify({ code: "NOT_FOUND", cause: "Chat not found" }),
			{
				status: 404,
			}
		);
	}

	const recentStreamId = await getLatestStreamIdByChatId({ chatId });
	if (!recentStreamId) {
		return new Response(
			JSON.stringify({ code: "NOT_FOUND", cause: "Stream not found" }),
			{
				status: 404,
			}
		);
	}

	const emptyDataStream = createUIMessageStream<ChatMessage>({
		execute: () => {
			return;
		},
	});

	const stream = await streamContext.resumableStream(recentStreamId, () =>
		emptyDataStream.pipeThrough(new JsonToSseTransformStream())
	);

	if (!stream) {
		const mostRecentMessage = await getLatestMessageByChatId({ chatId });
		if (!mostRecentMessage) {
			return new Response(
				JSON.stringify({
					code: "NOT_FOUND",
					cause: "Message not found",
				}),
				{
					status: 404,
				}
			);
		}

		if (mostRecentMessage.role !== "assistant") {
			return new Response(emptyDataStream, { status: 200 });
		}

		const messageCreatedAt = new Date(mostRecentMessage.createdAt);
		if (
			differenceInSeconds(resumeRequestedAt, messageCreatedAt) >
			SECONDS_PER_MINUTE
		) {
			return new Response(emptyDataStream, { status: 200 });
		}

		const restoredStream = createUIMessageStream<ChatMessage>({
			execute: ({ writer }) => {
				writer.write({
					type: "data-appendMessage",
					data: JSON.stringify(mostRecentMessage),
					transient: true,
				});
			},
		});

		return new Response(
			restoredStream.pipeThrough(new JsonToSseTransformStream()),
			{
				status: 200,
			}
		);
	}

	return new Response(stream, { status: 200 });
}
