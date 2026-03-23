/** biome-ignore-all lint/suspicious/noConsole: development request metadata logging */

import {
	convertToModelMessages,
	createUIMessageStream,
	createUIMessageStreamResponse,
	type LanguageModel,
	smoothStream,
	stepCountIs,
	streamText,
} from "ai";
import { getModel } from "@/lib/ai/models";
import { convertToUIMessages } from "@/lib/ai/utils";
import { createAuthErrorResponse, getAuthAccessState } from "@/lib/auth/utils";
import { env } from "@/lib/env.mjs";
import { BackpackError } from "@/lib/errors";
import { caller } from "@/lib/trpc/server";
import { getChatRequestPrefs } from "./_lib/prefs";
import { buildSystemPrompt } from "./_lib/prompt";
import { getReasoningProviderOptions } from "./_lib/provider-options";
import {
	createChatRequestLogPayload,
	logChatRequestMetadata,
} from "./_lib/request-logger";
import { startResumableStream } from "./_lib/resumable-stream";
import { DEFAULT_CHAT_TITLE, updateChatTitleInBackground } from "./_lib/title";
import { buildToolRuntime } from "./_lib/tools";
import { toUuidList } from "./_lib/utils";
import { postRequestBodySchema } from "./schema";

export const maxDuration = 60;

export async function POST(req: Request) {
	let requestBody: ReturnType<typeof postRequestBodySchema.parse>;

	try {
		const json = await req.json();
		requestBody = postRequestBodySchema.parse(json);
	} catch (error) {
		return BackpackError.api(
			"bad_request",
			"Invalid chat payload",
			error
		).toResponse();
	}

	try {
		const [accessState, prefs] = await Promise.all([
			getAuthAccessState(req.headers),
			getChatRequestPrefs(),
		]);

		if (accessState.status !== "approved") {
			return createAuthErrorResponse(accessState);
		}

		const { session } = accessState.authSession;
		const userId = session.userId;

		const { message, id: chatId, env: requestEnv } = requestBody;
		const enabledMcpServerIds = toUuidList(prefs.mcpServersState);

		const model = getModel(prefs.modelId);
		if (!model) {
			throw BackpackError.api(
				"bad_request",
				`Invalid model selected: ${prefs.modelId}`
			);
		}

		const { chat, previousMessages, userMemories, mcpServerConfigs } =
			await caller.chat.getChatRuntimeData({
				chatId,
				mcpServerIds: enabledMcpServerIds,
			});

		if (!chat) {
			await caller.chat.saveChat({
				id: chatId,
				title: DEFAULT_CHAT_TITLE,
				spaceId: requestEnv.inSpace ? requestEnv.spaceId : undefined,
			});

			updateChatTitleInBackground({
				chatId,
				message,
			});
		}

		await caller.chat.saveChatActiveStreamId({
			chatId,
			activeStreamId: null,
		});

		const uiMessages = [...convertToUIMessages(previousMessages), message];

		await caller.chat.saveMessages({
			messages: [
				{
					chatId,
					id: message.id,
					role: "user",
					parts: message.parts,
					attachments: [],
					createdAt: new Date(),
				},
			],
		});

		const stream = createUIMessageStream({
			execute: async ({ writer: dataStream }) => {
				const toolRuntime = await buildToolRuntime({
					toolsState: prefs.toolsState,
					userId,
					requestEnv,
					dataStream,
					mcpServerConfigs,
				});

				logChatRequestMetadata(
					createChatRequestLogPayload({
						chatId,
						message: {
							id: message.id,
							parts: message.parts,
						},
						userId,
						mode: prefs.mode,
						selectedAgent: prefs.selectedAgent,
						model: {
							id: model.id,
							name: model.name,
							provider: model.provider,
							capabilities: model.capabilities,
						},
						requestEnv,
						toolsState: prefs.toolsState,
						activeBuiltInTools: toolRuntime.activeBuiltInTools,
						enabledMcpServerIds,
						mcpToolNames: toolRuntime.mcpToolNames,
						allActiveTools: toolRuntime.activeTools.map(String),
					})
				);

				const result = streamText({
					model: model.instance as LanguageModel,
					providerOptions: getReasoningProviderOptions(model),
					messages: await convertToModelMessages(uiMessages),
					system: buildSystemPrompt({
						mode: prefs.mode,
						selectedAgent: prefs.selectedAgent,
						requestEnv,
						userMemories,
						toolsState: prefs.toolsState,
						mcpToolInfos: toolRuntime.mcpToolInfos,
					}),
					stopWhen: stepCountIs(10),
					experimental_transform: smoothStream({
						chunking: "word",
						delayInMs: 10,
					}),
					onError: () => {
						// streamText failures are handled by createUIMessageStream onError
					},
					onFinish: async () => {
						await toolRuntime.close();
					},
					activeTools: toolRuntime.activeTools,
					tools: toolRuntime.allTools,
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
						chatId,
					})),
				});

				await caller.chat.saveChatActiveStreamId({
					chatId,
					activeStreamId: null,
				});
			},
		});

		return createUIMessageStreamResponse({
			stream,
			async consumeSseStream({ stream: sseStream }) {
				if (!env.REDIS_URL) {
					return;
				}

				try {
					await startResumableStream({
						chatId,
						stream: sseStream,
					});
				} catch (error) {
					console.error("Failed to create resumable stream", error);
				}
			},
		});
	} catch (error) {
		if (error instanceof BackpackError) {
			return error.toResponse();
		}

		return BackpackError.api(
			"internal",
			"Failed to process chat request",
			error
		).toResponse();
	}
}
