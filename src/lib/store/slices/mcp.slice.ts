import type { StateCreator } from "zustand";
import type { BoundStore } from "../store";

export interface McpSlice {
	mcpServers: Record<string, boolean>;
	setMcpServer: (id: string, value: boolean) => void;
	setAllMcpServers: (servers: Record<string, boolean>) => void;
}

export const createMcpSlice: StateCreator<
	BoundStore,
	[["zustand/immer", never], ["zustand/persist", unknown]],
	[],
	McpSlice
> = (set) => ({
	mcpServers: {},
	setMcpServer: (id, value) =>
		set((state) => {
			state.mcpServers[id] = value;
		}),
	setAllMcpServers: (servers) =>
		set((state) => {
			state.mcpServers = servers;
		}),
});
