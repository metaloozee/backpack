import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { caller } from "@/lib/trpc/server";

export const DEFAULT_CHAT_TITLE = "Unnamed Chat";

const createChatTitle = async (message: {
	id: string;
	role: string;
	parts: unknown[];
}) => {
	const { object } = await generateObject({
		model: google("gemini-flash-lite-latest"),
		schema: z.object({
			title: z.string().max(100),
		}),
		prompt: `
    Given the following query, generate a title for the chat: ${JSON.stringify(message)}.
    Follow the schema provided.
                            `,
	});

	return object.title ?? DEFAULT_CHAT_TITLE;
};

export const updateChatTitleInBackground = (params: {
	chatId: string;
	message: {
		id: string;
		role: string;
		parts: unknown[];
	};
}) => {
	createChatTitle(params.message)
		.then(async (title) => {
			if (!title || title === DEFAULT_CHAT_TITLE) {
				return;
			}

			await caller.chat.updateChatTitleIfDefault({
				chatId: params.chatId,
				defaultTitle: DEFAULT_CHAT_TITLE,
				newTitle: title,
			});
		})
		.catch(() => {
			// non-critical background task
		});
};
