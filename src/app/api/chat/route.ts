/** biome-ignore-all lint/suspicious/noConsole: console.log */

import type { AnthropicProviderOptions } from "@ai-sdk/anthropic";
import { type GoogleGenerativeAIProviderOptions, google } from "@ai-sdk/google";
import {
	convertToModelMessages,
	createUIMessageStream,
	generateObject,
	JsonToSseTransformStream,
	type LanguageModel,
	smoothStream,
	stepCountIs,
	streamText,
} from "ai";
import { and, desc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { after } from "next/server";
import { createResumableStreamContext, type ResumableStreamContext } from "resumable-stream";
import { z } from "zod";
import { DEFAULT_MODEL_ID } from "@/lib/ai/defaults";
import { getModel } from "@/lib/ai/models";
import { AskModePrompt } from "@/lib/ai/prompts";
import { academicSearchTool } from "@/lib/ai/tools/academic-search";
import { extractTool } from "@/lib/ai/tools/extract";
import { financeSearchTool } from "@/lib/ai/tools/finance-search";
import { knowledgeSearchTool } from "@/lib/ai/tools/knowledge-search";
import { saveToMemoriesTool } from "@/lib/ai/tools/save-to-memories";
import { webSearchTool } from "@/lib/ai/tools/web-search";
import { convertToUIMessages } from "@/lib/ai/utils";
import { getSession } from "@/lib/auth/utils";
import { db } from "@/lib/db";
import { chat as dbChat, memories as dbMemories, message as dbMessage, stream as dbStream } from "@/lib/db/schema/app";
import { caller } from "@/lib/trpc/server";

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

type ToolsState = {
	webSearch?: boolean;
	knowledgeSearch?: boolean;
	academicSearch?: boolean;
	financeSearch?: boolean;
};

const parseToolsState = (toolsStateString: string | undefined): ToolsState => {
	if (!toolsStateString) {
		return {};
	}
	try {
		return JSON.parse(toolsStateString) as ToolsState;
	} catch (error) {
		console.error("Failed to parse tools state from cookie:", error);
		return {};
	}
};

const createChatTitle = async (message: { id: string; role: string; parts: unknown[] }) => {
	const { object } = await generateObject({
		model: google("gemini-2.5-flash-lite"),
		schema: z.object({
			title: z.string().max(100),
		}),
		prompt: `
    Given the following query, generate a title for the chat: ${JSON.stringify(message)}.
    Follow the schema provided.
                            `,
	});
	return object.title ?? "Unnamed Chat";
};

const buildActiveTools = (toolsState: ToolsState): ActiveTool[] => {
	const activeTools: ActiveTool[] = ["extract"];

	if (toolsState.webSearch) {
		activeTools.push("web_search");
	}
	if (toolsState.knowledgeSearch) {
		activeTools.push("knowledge_search");
	}
	if (toolsState.academicSearch) {
		activeTools.push("academic_search");
	}
	if (toolsState.financeSearch) {
		activeTools.push("finance_search");
	}

	return activeTools;
};

type ActiveTool =
	| "save_to_memories"
	| "extract"
	| "web_search"
	| "knowledge_search"
	| "academic_search"
	| "finance_search";

export async function POST(req: Request) {
	try {
		const session = await getSession();
		if (!session) {
			throw new Error("Access denied");
		}

		const json = await req.json();
		const requestBody = requestBodySchema.parse(json);

		try {
			const { message, id, env: requestEnv } = requestBody;

			const cookieStore = await cookies();
			const toolsStateString = cookieStore.get("X-Tools-State")?.value;
			const toolsState = parseToolsState(toolsStateString);

			console.log({
				webSearch: toolsState.webSearch ?? false,
				knowledgeSearch: toolsState.knowledgeSearch ?? false,
				academicSearch: toolsState.academicSearch ?? false,
				financeSearch: toolsState.financeSearch ?? false,
			});

			if (!(message && id)) {
				throw new Error("Message and ID are required");
			}

			const modelId = cookieStore.get("X-Model-Id")?.value ?? DEFAULT_MODEL_ID;
			const model = getModel(modelId);

			if (!model) {
				throw new Error("Invalid model selected");
			}

			const [chat] = await db
				.select()
				.from(dbChat)
				.where(and(eq(dbChat.id, id), eq(dbChat.userId, session.userId)))
				.limit(1);

			if (!chat) {
				const title = await createChatTitle(message);

				await caller.chat.saveChat({
					id,
					userId: session.userId,
					spaceId: requestEnv.inSpace ? requestEnv.spaceId : undefined,
					title,
				});
			}

			const previousMessages = await db.select().from(dbMessage).where(eq(dbMessage.chatId, id));

			const userMemories = await db
				.select({
					content: dbMemories.content,
					createdAt: dbMemories.createdAt,
				})
				.from(dbMemories)
				.where(eq(dbMemories.userId, session.userId))
				.orderBy(desc(dbMemories.createdAt));

			const uiMessages = [...convertToUIMessages(previousMessages), message];

			await caller.chat.saveMessages({
				messages: [
					{
						chatId: id,
						id: message.id,
						role: "user",
						parts: message.parts,
						attachments: [],
						createdAt: new Date(),
					},
				],
			});

			const streamId = crypto.randomUUID();
			await db.insert(dbStream).values({ id: streamId, chatId: id, createdAt: new Date() });

			const stream = createUIMessageStream({
				execute: ({ writer: dataStream }) => {
					const activeTools = buildActiveTools(toolsState);

					console.log(activeTools);

					const result = streamText({
						model: model.instance as LanguageModel,
						providerOptions: model.properties?.includes("reasoning")
							? {
									anthropic: {
										thinking: {
											type: "enabled",
											budgetTokens: 2048,
										},
									} satisfies AnthropicProviderOptions,
									google: {
										thinkingConfig: {
											thinkingBudget: 2048,
											includeThoughts: true,
										},
									} satisfies GoogleGenerativeAIProviderOptions,
								}
							: {},
						messages: convertToModelMessages(uiMessages),
						system: AskModePrompt({
							tools: {
								webSearch: toolsState.webSearch ?? false,
								knowledgeSearch: toolsState.knowledgeSearch ?? false,
								academicSearch: toolsState.academicSearch ?? false,
								financeSearch: toolsState.financeSearch ?? false,
							},
							env: {
								...requestEnv,
								memories: userMemories,
							},
						}),
						stopWhen: stepCountIs(10),
						experimental_transform: smoothStream({
							chunking: "word",
							delayInMs: 10,
						}),
						onError: (error) => {
							console.error(error);
						},
						activeTools,
						tools: {
							save_to_memories: saveToMemoriesTool({ session, dataStream }),
							extract: extractTool({ dataStream }),
							web_search: webSearchTool({ dataStream }),
							knowledge_search: knowledgeSearchTool({
								session,
								dataStream,
								env: requestEnv,
							}),
							academic_search: academicSearchTool({ dataStream }),
							finance_search: financeSearchTool({ dataStream }),
						},
					});

					result.consumeStream();
					dataStream.merge(result.toUIMessageStream({ sendReasoning: true }));
				},
				generateId: () => crypto.randomUUID(),
				onError: () => {
					return "Oops, an error occurred while processing your request.";
				},
				onFinish: async ({ messages }) => {
					await caller.chat.saveMessages({
						messages: messages.map((msg) => ({
							id: msg.id,
							role: msg.role,
							parts: msg.parts,
							createdAt: new Date(),
							attachments: [],
							chatId: id,
						})),
					});
				},
			});

			const streamContext = getStreamContext();
			if (streamContext) {
				return new Response(
					await streamContext.resumableStream(streamId, () =>
						stream.pipeThrough(new JsonToSseTransformStream())
					)
				);
			}
			return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
		} catch (error) {
			console.error(error);
			return new Response(JSON.stringify({ code: "INTERNAL_SERVER_ERROR", cause: error }), {
				status: 500,
			});
		}
	} catch (error) {
		console.error(error);
		return new Response(JSON.stringify({ code: "INTERNAL_SERVER_ERROR", cause: error }), {
			status: 500,
		});
	}
}

export const getStreamContext = () => {
	if (!globalStreamContext) {
		try {
			globalStreamContext = createResumableStreamContext({
				waitUntil: after,
			});
		} catch (error: unknown) {
			console.error(error);
		}
	}

	return globalStreamContext;
};

const textPartSchema = z.object({
	type: z.enum(["text"]),
	text: z.string().min(1).max(2000),
});

const filePartSchema = z.object({
	type: z.enum(["file"]),
	mediaType: z.enum(["image/jpeg", "image/png"]),
	name: z.string().min(1).max(100),
	url: z.string().url(),
});

const requestBodySchema = z.object({
	id: z.string().uuid(),
	env: z.object({
		inSpace: z.boolean(),
		spaceId: z.string().uuid().optional(),
		spaceName: z.string().optional(),
		spaceDescription: z.string().optional(),
	}),
	message: z.object({
		id: z.string().uuid(),
		role: z.enum(["user"]),
		parts: z.array(z.union([textPartSchema, filePartSchema])),
	}),
});
