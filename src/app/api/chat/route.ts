/** biome-ignore-all lint/suspicious/noConsole: console.log */

import type { AnthropicProviderOptions } from "@ai-sdk/anthropic";
import { type GoogleGenerativeAIProviderOptions, google } from "@ai-sdk/google";
import type { OpenAIResponsesProviderOptions } from "@ai-sdk/openai";
import {
	convertToModelMessages,
	createUIMessageStream,
	createUIMessageStreamResponse,
	generateObject,
	type LanguageModel,
	smoothStream,
	stepCountIs,
	streamText,
} from "ai";
import { cookies } from "next/headers";
import { after } from "next/server";
import {
	createResumableStreamContext,
	type ResumableStreamContext,
} from "resumable-stream";
import { z } from "zod";
import { DEFAULT_MODEL_ID } from "@/lib/ai/defaults";
import { getModel, normalizeModelId } from "@/lib/ai/models";
import AgentModePrompt from "@/lib/ai/prompts/agent";
import AskModePrompt from "@/lib/ai/prompts/ask";
import { academicSearchTool } from "@/lib/ai/tools/academic-search";
import { extractTool } from "@/lib/ai/tools/extract";
import { financeSearchTool } from "@/lib/ai/tools/finance-search";
import { knowledgeSearchTool } from "@/lib/ai/tools/knowledge-search";
import { saveToMemoriesTool } from "@/lib/ai/tools/save-to-memories";
import { webSearchTool } from "@/lib/ai/tools/web-search";
import { convertToUIMessages } from "@/lib/ai/utils";
import { getSession } from "@/lib/auth/utils";
import {
	createStream,
	getChatByIdAndUserId,
	getMcpServerConfigsByIds,
	getMemoriesByUserId,
	getMessagesByChatIdAndUserId,
	updateChatTitleIfDefault,
} from "@/lib/db/queries";
import {
	closeMcpClients,
	createMcpToolsForServers,
	type McpServerConfig,
} from "@/lib/mcp/client";
import { caller } from "@/lib/trpc/server";

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

interface ToolsState {
	webSearch?: boolean;
	knowledgeSearch?: boolean;
	academicSearch?: boolean;
	financeSearch?: boolean;
}

interface McpServersState {
	[serverId: string]: boolean;
}

interface UserPrefs {
	modelId: string;
	mode: string;
	selectedAgent: string | null;
	toolsState: ToolsState;
	mcpServersState: McpServersState;
}

const DEFAULT_CHAT_TITLE = "Unnamed Chat";

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

const updateChatTitleInBackground = (params: {
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
		.catch((error) => {
			console.error("Failed to generate chat title", error);
		});
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

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: too complex to refactor
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
			const raw = cookieStore.get("backpack-prefs")?.value;

			let prefs: UserPrefs = {
				modelId: DEFAULT_MODEL_ID,
				mode: "ask" as string,
				selectedAgent: null as string | null,
				toolsState: {} as ToolsState,
				mcpServersState: {} as McpServersState,
			};

			if (raw) {
				try {
					const parsed = JSON.parse(raw);
					const state = parsed?.state ?? {};
					prefs = {
						modelId: normalizeModelId(
							state.modelId ?? DEFAULT_MODEL_ID
						),
						mode: state.mode ?? "ask",
						selectedAgent: state.selectedAgent ?? null,
						toolsState: state.tools ?? {},
						mcpServersState: state.mcpServers ?? {},
					};
				} catch {
					// use defaults
				}
			}

			const {
				modelId: requestedModelId,
				mode,
				selectedAgent,
				toolsState,
				mcpServersState,
			} = prefs;
			const modelId = normalizeModelId(requestedModelId);
			const model = getModel(modelId);

			if (!model) {
				throw new Error("Invalid model selected");
			}

			console.log({
				webSearch: toolsState.webSearch ?? false,
				knowledgeSearch: toolsState.knowledgeSearch ?? false,
				academicSearch: toolsState.academicSearch ?? false,
				financeSearch: toolsState.financeSearch ?? false,
				mcpServers: mcpServersState,
			});

			if (!(message && id)) {
				throw new Error("Message and ID are required");
			}

			if (!model) {
				throw new Error("Invalid model selected");
			}

			const enabledMcpServerIds = Object.entries(mcpServersState)
				.filter(([_, enabled]) => enabled)
				.map(([serverId]) => serverId);

			const [chat, previousMessages, userMemories, mcpServerConfigs] =
				await Promise.all([
					getChatByIdAndUserId({ id, userId: session.userId }),
					getMessagesByChatIdAndUserId({
						chatId: id,
						userId: session.userId,
					}),
					getMemoriesByUserId({ userId: session.userId }),
					enabledMcpServerIds.length > 0
						? getMcpServerConfigsByIds({
								ids: enabledMcpServerIds,
								userId: session.userId,
							})
						: Promise.resolve([]),
				]);
			const shouldGenerateTitle = !chat;

			if (!chat) {
				await caller.chat.saveChat({
					id,
					userId: session.userId,
					spaceId: requestEnv.inSpace
						? requestEnv.spaceId
						: undefined,
					title: DEFAULT_CHAT_TITLE,
				});
			}

			if (shouldGenerateTitle) {
				updateChatTitleInBackground({
					chatId: id,
					userId: session.userId,
					message,
				});
			}

			const uiMessages = [
				...convertToUIMessages(previousMessages),
				message,
			];

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
			await createStream({
				id: streamId,
				chatId: id,
				createdAt: new Date(),
			});

			const stream = createUIMessageStream({
				execute: async ({ writer: dataStream }) => {
					const activeTools = buildActiveTools(toolsState);

					// Create MCP tools if there are enabled servers
					const mcpServersForTools: McpServerConfig[] =
						mcpServerConfigs
							.filter((config) => config.enabled)
							.map((config) => ({
								name: config.name,
								url: config.url,
								apiKey: config.apiKeyEncrypted ?? undefined,
							}));

					const mcpToolsResult =
						mcpServersForTools.length > 0
							? await createMcpToolsForServers(mcpServersForTools)
							: {
									tools: {},
									clients: [],
									serverNames: new Map(),
									toolInfos: [],
								};

					// Add MCP tool names to active tools
					const mcpToolNames = Object.keys(mcpToolsResult.tools);
					const allActiveTools = [...activeTools, ...mcpToolNames];

					console.log({
						activeTools,
						mcpToolNames,
						allActiveTools,
					});

					// Build provider-specific reasoning options based on model
					const isGemini3 = model.id.startsWith("gemini-3");
					const googleThinkingConfig = isGemini3
						? {
								thinkingLevel: "high" as const,
								includeThoughts: true,
							}
						: { thinkingBudget: 8192, includeThoughts: true };

					const reasoningProviderOptions = model.capabilities
						.reasoning
						? {
								anthropic: {
									thinking: {
										type: "enabled",
										budgetTokens: 10_000,
									},
								} satisfies AnthropicProviderOptions,
								google: {
									thinkingConfig: googleThinkingConfig,
								} as GoogleGenerativeAIProviderOptions,
								openai: {
									reasoningEffort: "medium",
									reasoningSummary: "detailed",
								} satisfies OpenAIResponsesProviderOptions,
							}
						: undefined;

					// Build combined tools object
					const allTools = {
						save_to_memories: saveToMemoriesTool({
							session,
							dataStream,
						}),
						extract: extractTool({ dataStream }),
						web_search: webSearchTool({ dataStream }),
						knowledge_search: knowledgeSearchTool({
							session,
							dataStream,
							env: requestEnv,
						}),
						academic_search: academicSearchTool({ dataStream }),
						finance_search: financeSearchTool({ dataStream }),
						...mcpToolsResult.tools,
					};

					const result = streamText({
						model: model.instance as LanguageModel,
						providerOptions: reasoningProviderOptions,
						messages: await convertToModelMessages(uiMessages),
						system:
							mode === "agent" && selectedAgent
								? AgentModePrompt({
										agent: selectedAgent,
										env: {
											...requestEnv,
											memories: userMemories,
										},
									})
								: AskModePrompt({
										tools: {
											webSearch:
												toolsState.webSearch ?? false,
											knowledgeSearch:
												toolsState.knowledgeSearch ??
												false,
											academicSearch:
												toolsState.academicSearch ??
												false,
											financeSearch:
												toolsState.financeSearch ??
												false,
										},
										mcpTools: mcpToolsResult.toolInfos,
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
						onFinish: async () => {
							// Close MCP clients after streaming is done
							if (mcpToolsResult.clients.length > 0) {
								await closeMcpClients(mcpToolsResult.clients);
							}
						},
						activeTools:
							allActiveTools as (keyof typeof allTools)[],
						tools: allTools,
					});

					result.consumeStream();

					dataStream.merge(
						result.toUIMessageStream({ sendReasoning: true })
					);
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

			// Currently disabled
			// const streamContext = getStreamContext();
			// if (streamContext) {
			// 	return createUIMessageStreamResponse({
			// 		stream,
			// 		headers: {
			// 			"Cache-Control": "no-cache, no-transform",
			// 			"X-Accel-Buffering": "no",
			// 		},
			// 	});
			// }

			return createUIMessageStreamResponse({
				stream,
				headers: {
					"Cache-Control": "no-cache, no-transform",
					"X-Accel-Buffering": "no",
				},
			});
		} catch (error) {
			console.error(error);
			return new Response(
				JSON.stringify({ code: "INTERNAL_SERVER_ERROR", cause: error }),
				{
					status: 500,
				}
			);
		}
	} catch (error) {
		console.error(error);
		return new Response(
			JSON.stringify({ code: "INTERNAL_SERVER_ERROR", cause: error }),
			{
				status: 500,
			}
		);
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
		spaceCustomInstructions: z.string().optional(),
	}),
	message: z.object({
		id: z.string().uuid(),
		role: z.enum(["user"]),
		parts: z.array(z.union([textPartSchema, filePartSchema])),
	}),
});
