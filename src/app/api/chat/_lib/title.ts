import { groq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { z } from "zod";
import { updateChatTitleIfDefault } from "@/lib/db/queries/chat";

export const DEFAULT_CHAT_TITLE = "Unnamed Chat";

const createChatTitle = async (message: {
	id: string;
	role: string;
	parts: unknown[];
}) => {
	const { object } = await generateObject({
		model: groq("openai/gpt-oss-120b"),
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
	userId: string;
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

			await updateChatTitleIfDefault({
				chatId: params.chatId,
				userId: params.userId,
				defaultTitle: DEFAULT_CHAT_TITLE,
				newTitle: title,
			});
		})
		.catch(() => {
			// non-critical background task
		});
};
