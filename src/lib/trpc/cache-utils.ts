import type { InfiniteData } from "@tanstack/react-query";
import type { Chat as ChatType } from "@/lib/db/schema/app";

export type ChatListPage = {
	chats: ChatType[];
	nextCursor: Date | undefined;
};

export type ChatInfiniteData = InfiniteData<ChatListPage, Date | null>;

export function removeChatFromInfiniteData(
	data: ChatInfiniteData | undefined,
	chatId: string
): ChatInfiniteData | undefined {
	if (!data) {
		return data;
	}

	let shouldUpdate = false;
	const pages = data.pages.map((page) => {
		const filteredChats = page.chats.filter((chat) => chat.id !== chatId);
		if (filteredChats.length !== page.chats.length) {
			shouldUpdate = true;
			return {
				...page,
				chats: filteredChats,
			};
		}
		return page;
	});

	if (!shouldUpdate) {
		return data;
	}

	return {
		...data,
		pages,
	};
}

export function prependChatToInfiniteData(
	data: ChatInfiniteData | undefined,
	chat: ChatType
): ChatInfiniteData | undefined {
	if (!data) {
		return data;
	}

	let shouldUpdate = false;
	const pages = data.pages.map((page, index) => {
		if (index !== 0) {
			return page;
		}

		const existingIndex = page.chats.findIndex((existingChat) => existingChat.id === chat.id);
		if (existingIndex === 0) {
			return page;
		}

		const remainingChats =
			existingIndex === -1 ? page.chats : page.chats.filter((existingChat) => existingChat.id !== chat.id);
		const chats = [chat, ...remainingChats];
		shouldUpdate = true;

		return {
			...page,
			chats,
		};
	});

	if (!shouldUpdate) {
		return data;
	}

	return {
		...data,
		pages,
	};
}
