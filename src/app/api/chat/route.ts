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
import { getChatRequestPrefs } from "@/app/api/chat/_lib/prefs";
import { buildSystemPrompt } from "@/app/api/chat/_lib/prompt";
import { getReasoningProviderOptions } from "@/app/api/chat/_lib/provider-options";
import {
	createChatRequestLogPayload,
	logChatRequestMetadata,
} from "@/app/api/chat/_lib/request-logger";
import { startResumableStream } from "@/app/api/chat/_lib/resumable-stream";
import {
	DEFAULT_CHAT_TITLE,
	updateChatTitleInBackground,
} from "@/app/api/chat/_lib/title";
import { buildToolRuntime } from "@/app/api/chat/_lib/tools";
import { toUuidList } from "@/app/api/chat/_lib/utils";
import { getModel } from "@/lib/ai/models";
import { convertToUIMessages } from "@/lib/ai/utils";
import { createAuthErrorResponse, getAuthAccessState } from "@/lib/auth/utils";
import {
	getChatByIdAndUserId,
	getMessagesByChatIdAndUserId,
	saveChat,
	saveMessages,
	setChatActiveStreamId,
} from "@/lib/db/queries/chat";
import { getMcpServerConfigsByIds } from "@/lib/db/queries/mcp";
import { getMemoriesByUserId } from "@/lib/db/queries/memories";
import { env } from "@/lib/env.mjs";
import { BackpackError } from "@/lib/errors";
import { postRequestBodySchema } from "./schema";

export const maxDuration = 60;

export async function POST(request: Request) {
	let requestBody: ReturnType<typeof postRequestBodySchema.parse>;

	try {
		const json = await request.json();
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
			getAuthAccessState(request.headers),
			getChatRequestPrefs(),
		]);

		if (accessState.status !== "approved") {
			return createAuthErrorResponse(accessState);
		}

		const { session } = accessState.authSession;
		const userId = session.userId;
		const {
			message,
			id: chatId,
			env: requestEnv,
			artifactContext,
		} = requestBody;
		const enabledMcpServerIds = toUuidList(prefs.mcpServersState);

		const model = getModel(prefs.modelId);
		if (!model) {
			throw BackpackError.api(
				"bad_request",
				`Invalid model selected: ${prefs.modelId}`
			);
		}

		const [chat, previousMessages, userMemories, mcpServerConfigs] =
			await Promise.all([
				getChatByIdAndUserId({ chatId, userId }),
				getMessagesByChatIdAndUserId({ chatId, userId }),
				getMemoriesByUserId({ userId }),
				getMcpServerConfigsByIds({
					ids: enabledMcpServerIds,
					userId,
				}),
			]);

		if (!chat) {
			await saveChat({
				id: chatId,
				userId,
				title: DEFAULT_CHAT_TITLE,
				spaceId: requestEnv.inSpace ? requestEnv.spaceId : undefined,
			});

			updateChatTitleInBackground({
				chatId,
				userId,
				message,
			});
		}

		await setChatActiveStreamId({
			chatId,
			userId,
			activeStreamId: null,
		});

		const uiMessages = [...convertToUIMessages(previousMessages), message];

		await saveMessages({
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
					chatId,
					requestEnv,
					dataStream,
					mcpServerConfigs,
					artifactModel: model.instance as LanguageModel,
					artifactContext,
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
				await saveMessages({
					messages: messages.map((msg) => ({
						id: msg.id,
						role: msg.role,
						parts: msg.parts,
						createdAt: new Date(),
						attachments: [],
						chatId,
					})),
				});

				await setChatActiveStreamId({
					chatId,
					userId,
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
						userId,
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
