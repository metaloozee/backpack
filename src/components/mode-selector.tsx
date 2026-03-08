"use client";

import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
	CheckIcon,
	ServerIcon,
	Settings2Icon,
	TelescopeIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { defaultTools } from "@/lib/ai/tools";
import { slideVariants, transitions } from "@/lib/animations";
import { getMcpStatus, isMcpServerDisabled } from "@/lib/mcp/status";
import type { ModeType } from "@/lib/store/slices/mode.slice";
import { usePrefsStore } from "@/lib/store/store";
import { useTRPC } from "@/lib/trpc/trpc";
import { cn } from "@/lib/utils";

const modeTypes = [
	{ value: "ask", label: "Ask", disabled: false },
	{ value: "agent", label: "Agent", disabled: false },
] as const;

export function ModeSelector() {
	// All state from the store — no local useState
	const mode = usePrefsStore((s) => s.mode);
	const setMode = usePrefsStore((s) => s.setMode);
	const selectedAgent = usePrefsStore((s) => s.selectedAgent);
	const setSelectedAgent = usePrefsStore((s) => s.setSelectedAgent);
	const tools = usePrefsStore((s) => s.tools);
	const setTool = usePrefsStore((s) => s.setTool);
	const setAllTools = usePrefsStore((s) => s.setAllTools);
	const resetTools = usePrefsStore((s) => s.resetTools);
	const mcpServers = usePrefsStore((s) => s.mcpServers);
	const setMcpServer = usePrefsStore((s) => s.setMcpServer);

	const trpc = useTRPC();
	const { data: mcpServersData } = useQuery(
		trpc.mcp.getServers.queryOptions(undefined, {
			enabled: mode === "ask",
		})
	);

	const handleModeChange = (value: string) => {
		const newMode = value as ModeType;
		if (newMode === mode) {
			return;
		}

		setMode(newMode);

		if (newMode === "agent") {
			// Clear all tools when switching to agent mode
			const cleared = Object.fromEntries(
				defaultTools.map((t) => [t.id, false])
			);
			setAllTools(cleared as typeof tools);
		} else {
			// Restore defaults when switching back to ask
			resetTools();
		}
	};

	const handleAgentSelect = (agentKey: string) => {
		const newAgent = selectedAgent === agentKey ? null : agentKey;
		setSelectedAgent(newAgent);
	};

	return (
		<motion.div
			className="flex flex-row items-center justify-start gap-2"
			layout
			transition={transitions.smooth}
		>
			<motion.div
				animate="visible"
				className="flex items-center"
				initial="hidden"
				transition={transitions.smooth}
				variants={slideVariants.up}
			>
				<Tabs onValueChange={handleModeChange} value={mode}>
					<TabsList className="bg-neutral-950">
						{modeTypes.map((m) => (
							<TabsTrigger
								className="text-xs"
								disabled={m.disabled}
								key={m.value}
								value={m.value}
							>
								{m.label}
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>

				{mode === "ask" && (
					<DropdownMenu>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<DropdownMenuTrigger asChild>
										<Button
											aria-label="Ask mode options"
											className="ml-1 h-7 w-7 rounded-sm border-0 bg-transparent p-0 hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
											size="icon"
											variant="ghost"
										>
											<Settings2Icon className="size-3.5" />
										</Button>
									</DropdownMenuTrigger>
								</TooltipTrigger>
								<TooltipContent>
									<p>Configure Tools</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
						<DropdownMenuContent
							align="start"
							className="w-xs border-neutral-800 bg-neutral-950"
						>
							{defaultTools.map((tool) => {
								const IconComponent = tool.icon;
								const isChecked = tools[tool.id];
								return (
									<DropdownMenuItem
										className="flex cursor-pointer items-center justify-between p-3 hover:bg-neutral-800"
										key={tool.id}
										onClick={(e) => e.preventDefault()}
									>
										<div className="flex items-center gap-3">
											<IconComponent className="size-4 text-muted-foreground" />
											<div className="flex flex-col">
												<span className="font-medium text-sm">
													{tool.name}
												</span>
												<span className="text-muted-foreground text-xs">
													{tool.description}
												</span>
											</div>
										</div>
										<Switch
											checked={isChecked}
											key={`tool-switch-${tool.id}-${isChecked}`}
											onCheckedChange={(checked) =>
												setTool(tool.id, checked)
											}
										/>
									</DropdownMenuItem>
								);
							})}

							{mcpServersData?.servers &&
								mcpServersData.servers.length > 0 && (
									<>
										<DropdownMenuSeparator className="bg-neutral-800" />
										<DropdownMenuLabel className="px-3 py-2 font-medium text-muted-foreground text-xs">
											MCP Servers
										</DropdownMenuLabel>
										{mcpServersData.servers.map(
											(server) => {
												const isChecked =
													mcpServers[server.id] ??
													false;
												const status = getMcpStatus({
													lastConnectedAt:
														server.lastConnectedAt,
													lastError: server.lastError,
													hasApiKey: server.hasApiKey,
												});
												const disabled =
													isMcpServerDisabled(status);
												const toolCount =
													server.toolsCache &&
													Array.isArray(
														server.toolsCache
													)
														? server.toolsCache
																.length
														: 0;

												const subtitle = (() => {
													if (disabled) {
														if (
															status ===
															"needs_auth"
														) {
															return "Authenticate to connect";
														}
														if (
															status === "failed"
														) {
															return "Connection failed";
														}
														return "Connection unknown";
													}
													if (status === "degraded") {
														return "Retry recommended";
													}
													return server.url;
												})();

												return (
													<DropdownMenuItem
														className={cn(
															"flex cursor-pointer items-center justify-between p-3 hover:bg-neutral-800",
															disabled &&
																"cursor-not-allowed opacity-70"
														)}
														disabled={disabled}
														key={server.id}
														onClick={(e) =>
															e.preventDefault()
														}
													>
														<div className="flex items-center gap-3">
															<ServerIcon className="size-4 text-muted-foreground" />
															<div className="flex flex-col">
																<div className="flex items-center gap-2">
																	<span className="font-medium text-sm">
																		{
																			server.name
																		}
																	</span>
																	{toolCount >
																		0 && (
																		<Badge
																			className="h-4 px-1 text-[10px]"
																			variant="secondary"
																		>
																			{
																				toolCount
																			}
																		</Badge>
																	)}
																</div>
																<span className="text-muted-foreground text-xs">
																	{subtitle}
																</span>
															</div>
														</div>
														<Switch
															checked={isChecked}
															disabled={disabled}
															key={`mcp-switch-${server.id}-${isChecked}`}
															onCheckedChange={(
																checked
															) =>
																setMcpServer(
																	server.id,
																	checked
																)
															}
														/>
													</DropdownMenuItem>
												);
											}
										)}
									</>
								)}
						</DropdownMenuContent>
					</DropdownMenu>
				)}

				{mode === "agent" && (
					<DropdownMenu>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<DropdownMenuTrigger asChild>
										<Button
											aria-label="Agent mode options"
											className="ml-1 h-7 w-7 rounded-sm border-0 bg-transparent p-0 hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
											size="icon"
											variant="ghost"
										>
											<Settings2Icon className="size-3.5" />
										</Button>
									</DropdownMenuTrigger>
								</TooltipTrigger>
								<TooltipContent>
									<p>Select Agent</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
						<DropdownMenuContent
							align="start"
							className="w-xs border-neutral-800 bg-neutral-950"
						>
							{["research"].map((agentKey) => {
								const isSelected = selectedAgent === agentKey;
								return (
									<DropdownMenuItem
										className="flex cursor-pointer items-center justify-between p-3 hover:bg-neutral-800"
										key={agentKey}
										onSelect={(e) => {
											e.preventDefault();
											handleAgentSelect(agentKey);
										}}
									>
										<div className="flex items-center gap-3">
											<TelescopeIcon className="size-4 text-muted-foreground" />
											<div className="flex flex-col">
												<span className="font-medium text-sm">
													{agentKey
														.charAt(0)
														.toUpperCase() +
														agentKey.slice(1)}
												</span>
												<span className="text-muted-foreground text-xs">
													{agentKey
														.charAt(0)
														.toUpperCase() +
														agentKey.slice(1)}{" "}
													agent
												</span>
											</div>
										</div>
										{isSelected && (
											<CheckIcon className="size-4 text-primary" />
										)}
									</DropdownMenuItem>
								);
							})}
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</motion.div>

			<div className="relative flex max-w-[112px] items-center gap-1 overflow-hidden sm:max-w-[140px]">
				<AnimatePresence initial={false}>
					{mode === "ask" &&
						defaultTools
							.filter((t) => tools[t.id])
							.map((t) => {
								const Icon = t.icon;
								return (
									<motion.div
										animate={{ opacity: 1, scale: 1, y: 0 }}
										exit={{ opacity: 0, scale: 0.9, y: -2 }}
										initial={{
											opacity: 0,
											scale: 0.9,
											y: 2,
										}}
										key={`selected-tool-${t.id}-${tools[t.id]}`}
										layout
										transition={transitions.smooth}
									>
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger asChild>
													<div className="flex size-6 shrink-0 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900">
														<Icon className="size-3.5 text-muted-foreground" />
													</div>
												</TooltipTrigger>
												<TooltipContent>
													<span className="text-xs">
														{t.name}
													</span>
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
									</motion.div>
								);
							})}
				</AnimatePresence>
			</div>
		</motion.div>
	);
}
