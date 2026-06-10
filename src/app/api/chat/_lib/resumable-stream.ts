import { after } from "next/server";
import { createResumableStreamContext } from "resumable-stream";
import { createStream, setChatActiveStreamId } from "@/lib/db/queries/chat";

export const getStreamContext = () => {
	try {
		return createResumableStreamContext({ waitUntil: after });
	} catch {
		return null;
	}
};

export const startResumableStream = async ({
	chatId,
	userId,
	stream,
}: {
	chatId: string;
	userId: string;
	stream: ReadableStream<string>;
}): Promise<void> => {
	const streamContext = getStreamContext();

	if (!streamContext) {
		return;
	}

	const streamId = crypto.randomUUID();

	await createStream({
		id: streamId,
		chatId,
		createdAt: new Date(),
	});

	await streamContext.createNewResumableStream(streamId, () => stream);

	await setChatActiveStreamId({
		chatId,
		userId,
		activeStreamId: streamId,
	});
};
