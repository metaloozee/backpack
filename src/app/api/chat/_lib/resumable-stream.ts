import { after } from "next/server";
import { createResumableStreamContext } from "resumable-stream";
import { caller } from "@/lib/trpc/server";

export const getStreamContext = () => {
	try {
		return createResumableStreamContext({ waitUntil: after });
	} catch {
		return null;
	}
};

export const startResumableStream = async ({
	chatId,
	stream,
}: {
	chatId: string;
	stream: ReadableStream<string>;
}): Promise<void> => {
	const streamContext = getStreamContext();

	if (!streamContext) {
		return;
	}

	const streamId = crypto.randomUUID();

	await caller.chat.createStream({
		streamId,
		chatId,
	});

	await streamContext.createNewResumableStream(streamId, () => stream);

	await caller.chat.saveChatActiveStreamId({
		chatId,
		activeStreamId: streamId,
	});
};
