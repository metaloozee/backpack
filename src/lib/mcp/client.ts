import { createMCPClient, type MCPClient } from "@ai-sdk/mcp";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
	decryptKey,
	type EncryptedKeyInput,
	parseEncryptedKey,
} from "@/lib/mcp/encryption";
import { assertPublicHttpsUrl } from "@/lib/server/security/url-policy";

export interface McpServerConfig {
	apiKey?: EncryptedKeyInput;
	id?: string;
	name: string;
	url: string;
}

export interface TestConnectionResult {
	error?: string;
	success: boolean;
	tools?: Array<{ name: string; description?: string }>;
}

export async function testMcpConnection(
	url: string,
	apiKey?: string
): Promise<TestConnectionResult> {
	const client = new Client({ name: "backpack-test", version: "1.0.0" });
	const safeUrl = await assertPublicHttpsUrl(url);

	try {
		const transportInit: RequestInit | undefined = apiKey
			? {
					headers: {
						Authorization: `Bearer ${apiKey}`,
					},
				}
			: undefined;

		const transport = new StreamableHTTPClientTransport(new URL(safeUrl), {
			requestInit: transportInit,
		});

		await client.connect(transport);
		const { tools } = await client.listTools();

		return {
			success: true,
			tools: tools.map((tool) => ({
				name: tool.name,
				description: tool.description,
			})),
		};
	} catch (error) {
		let errorMessage = "Unknown error";

		if (error instanceof Error) {
			if ("code" in error) {
				const code = (error as { code?: string }).code;
				if (code === "ECONNREFUSED") {
					errorMessage = "Connection refused";
				} else if (code === "ETIMEDOUT") {
					errorMessage = "Connection timeout";
				} else {
					errorMessage = error.message;
				}
			} else {
				errorMessage = error.message;
			}
		}

		return {
			success: false,
			error: errorMessage,
		};
	} finally {
		await client.close();
	}
}

type McpToolSet = Record<string, unknown>;

export interface McpToolInfo {
	description?: string;
	id: string;
	serverName: string;
	toolName: string;
}

export interface McpToolsResult {
	clients: MCPClient[];
	toolInfos: McpToolInfo[];
	tools: McpToolSet;
}

const MCP_TOOL_ID_PATTERN = /[^a-zA-Z0-9_-]+/g;
const MAX_MCP_TOOL_ID_LENGTH = 64;

const sanitizeToolIdSegment = (value: string): string =>
	value
		.replace(MCP_TOOL_ID_PATTERN, "_")
		.replace(/^_+|_+$/g, "")
		.slice(0, MAX_MCP_TOOL_ID_LENGTH)
		.toLowerCase();

const deterministicHash = (value: string): string => {
	let hash = 0x811c_9dc5;
	for (const char of value) {
		hash ^= char.charCodeAt(0);
		hash = Math.imul(hash, 0x0100_0193);
	}
	return (hash >>> 0).toString(36);
};

function createMcpToolId({
	server,
	toolName,
	existingIds,
}: {
	server: McpServerConfig;
	toolName: string;
	existingIds: Record<string, unknown>;
}): string {
	const serverSegment = sanitizeToolIdSegment(server.id ?? server.name);
	const toolSegment = sanitizeToolIdSegment(toolName) || "tool";
	const baseId = `mcp_${serverSegment || "server"}_${toolSegment}`.slice(
		0,
		MAX_MCP_TOOL_ID_LENGTH
	);

	if (!(baseId in existingIds)) {
		return baseId;
	}

	const hash = deterministicHash(`${server.id ?? server.name}:${toolName}`);
	const suffix = `_${hash}`;
	return `${baseId.slice(0, MAX_MCP_TOOL_ID_LENGTH - suffix.length)}${suffix}`;
}

export async function createMcpToolsForServers(
	servers: McpServerConfig[]
): Promise<McpToolsResult> {
	const allTools: McpToolSet = {};
	const clients: MCPClient[] = [];
	const toolInfos: McpToolInfo[] = [];

	for (const server of servers) {
		try {
			const safeUrl = await assertPublicHttpsUrl(server.url);
			const decryptedApiKey = server.apiKey
				? decryptKey(parseEncryptedKey(server.apiKey))
				: undefined;

			const mcpClient = await createMCPClient({
				transport: {
					type: "http",
					url: safeUrl,
					headers: decryptedApiKey
						? { Authorization: `Bearer ${decryptedApiKey}` }
						: undefined,
				},
			});

			clients.push(mcpClient);

			const tools = await mcpClient.tools();

			for (const [toolName, tool] of Object.entries(tools)) {
				const prefixedName = createMcpToolId({
					server,
					toolName,
					existingIds: allTools,
				});
				allTools[prefixedName] = tool;

				// Extract description from tool if available
				const toolWithMeta = tool as { description?: string };
				toolInfos.push({
					id: prefixedName,
					serverName: server.name,
					toolName,
					description: toolWithMeta.description,
				});
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error(
				`Failed to create MCP client for server ${server.name}:`,
				errorMessage
			);
		}
	}

	return { tools: allTools, clients, toolInfos };
}

export async function closeMcpClients(clients: MCPClient[]): Promise<void> {
	for (const client of clients) {
		try {
			await client.close();
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error("Error closing MCP client:", errorMessage);
		}
	}
}
