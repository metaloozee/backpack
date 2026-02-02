import { createMCPClient, type MCPClient } from "@ai-sdk/mcp";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
	decryptKey,
	type EncryptedKeyInput,
	parseEncryptedKey,
} from "@/lib/mcp/encryption";

export interface McpServerConfig {
	name: string;
	url: string;
	apiKey?: EncryptedKeyInput;
}

export interface TestConnectionResult {
	success: boolean;
	tools?: Array<{ name: string; description?: string }>;
	error?: string;
}

export async function testMcpConnection(
	url: string,
	apiKey?: string
): Promise<TestConnectionResult> {
	const client = new Client({ name: "backpack-test", version: "1.0.0" });

	try {
		const transportInit: RequestInit | undefined = apiKey
			? {
					headers: {
						Authorization: `Bearer ${apiKey}`,
					},
				}
			: undefined;

		const transport = new StreamableHTTPClientTransport(new URL(url), {
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

export async function createMcpClientForServer(
	server: McpServerConfig
): Promise<Client> {
	const client = new Client({
		name: `backpack-${server.name}`,
		version: "1.0.0",
	});

	const decryptedApiKey = server.apiKey
		? decryptKey(parseEncryptedKey(server.apiKey))
		: undefined;

	const transportInit: RequestInit | undefined = decryptedApiKey
		? {
				headers: {
					Authorization: `Bearer ${decryptedApiKey}`,
				},
			}
		: undefined;

	const transport = new StreamableHTTPClientTransport(new URL(server.url), {
		requestInit: transportInit,
	});

	await client.connect(transport);
	return client;
}

// MCP tools are a record of tool name to tool definition
type McpToolSet = Record<string, unknown>;

export interface McpToolInfo {
	serverName: string;
	toolName: string;
	description?: string;
}

export interface McpToolsResult {
	tools: McpToolSet;
	clients: MCPClient[];
	serverNames: Map<string, string>;
	toolInfos: McpToolInfo[];
}

/**
 * Creates MCP clients and tools for the given servers using @ai-sdk/mcp.
 * Returns tools that are directly compatible with streamText.
 */
export async function createMcpToolsForServers(
	servers: McpServerConfig[]
): Promise<McpToolsResult> {
	const allTools: McpToolSet = {};
	const clients: MCPClient[] = [];
	const serverNames = new Map<string, string>();
	const toolInfos: McpToolInfo[] = [];

	for (const server of servers) {
		try {
			const decryptedApiKey = server.apiKey
				? decryptKey(parseEncryptedKey(server.apiKey))
				: undefined;

			const mcpClient = await createMCPClient({
				transport: {
					type: "http",
					url: server.url,
					headers: decryptedApiKey
						? { Authorization: `Bearer ${decryptedApiKey}` }
						: undefined,
				},
			});

			clients.push(mcpClient);

			const tools = await mcpClient.tools();

			for (const [toolName, tool] of Object.entries(tools)) {
				const prefixedName = `mcp_${server.name}_${toolName}`;
				allTools[prefixedName] = tool;
				serverNames.set(prefixedName, server.name);

				// Extract description from tool if available
				const toolWithMeta = tool as { description?: string };
				toolInfos.push({
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

	return { tools: allTools, clients, serverNames, toolInfos };
}

/**
 * Closes all MCP clients.
 */
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

export async function getMcpToolsForServers(
	servers: McpServerConfig[]
): Promise<Record<string, object>> {
	const allTools: Record<string, object> = {};
	const clients: Client[] = [];

	try {
		for (const server of servers) {
			try {
				const client = await createMcpClientForServer(server);
				clients.push(client);

				const { tools } = await client.listTools();

				for (const tool of tools) {
					const prefixedName = `${server.name}_${tool.name}`;
					allTools[prefixedName] = {
						name: prefixedName,
						description: tool.description,
						inputSchema: tool.inputSchema,
					};
				}
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				console.error(
					`Failed to get tools from server ${server.name}:`,
					errorMessage
				);
			}
		}
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : String(error);
		console.error("Failed to get MCP tools:", errorMessage);
	} finally {
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

	return allTools;
}
