"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
	CheckIcon,
	ServerIcon,
	Settings2Icon,
	TelescopeIcon,
} from "lucide-react";
import { type Dispatch, type SetStateAction, useState } from "react";
import { toast } from "sonner";
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
import {
	defaultTools,
	getDefaultToolsState,
	type ToolsState,
} from "@/lib/ai/tools";
import { slideVariants, transitions } from "@/lib/animations";
import { getMcpStatus, isMcpServerDisabled } from "@/lib/mcp/status";
import { useTRPC } from "@/lib/trpc/trpc";
import { cn } from "@/lib/utils";

const modeTypes = [
	{
		value: "ask",
		label: "Ask",
		description: "Standard mode with all features",
		tools: {
			webSearch: true,
			knowledgeSearch: true,
			academicSearch: true,
			financeSearch: true,
		},
		disabled: false,
	},
	{
		value: "agent",
		label: "Agent",
		description: "Specialized sets of agents for agentic workflows",
		agents: {
			research: true,
		},
		disabled: false,
	},
] as const;

type ModeType = (typeof modeTypes)[number]["value"];

interface ModeSelectorProps {
	tools: ToolsState;
	setTools: Dispatch<SetStateAction<ToolsState>>;
	initialMode?: string;
	initialAgent?: string;
	initialMcpServers?: Record<string, boolean>;
}

export function ModeSelector({
	tools,
	setTools,
	initialMode,
	initialAgent,
	initialMcpServers = {},
}: ModeSelectorProps) {
	const [selectedMode, setSelectedMode] = useState<ModeType>(
		(initialMode as ModeType) ?? "ask"
	);
	const [selectedAgent, setSelectedAgent] = useState<string | null>(
		initialAgent ?? null
	);
	const [mcpServersState, setMcpServersState] =
		useState<Record<string, boolean>>(initialMcpServers);

	const trpc = useTRPC();
	const { data: mcpServersData } = useQuery(
		trpc.mcp.getServers.queryOptions(undefined, {
			enabled: selectedMode === "ask",
		})
	);

	const setToolsSelectionMutation = useMutation(
		trpc.chat.setToolsSelection.mutationOptions()
	);
	const setModeSelectionMutation = useMutation(
		trpc.chat.setModeSelection.mutationOptions()
	);
	const setMcpServersSelectionMutation = useMutation(
		trpc.chat.setMcpServersSelection.mutationOptions()
	);

	const updateTool = (toolId: string, value: boolean) => {
		const previousValue = tools[toolId];

		const newState = {
			...tools,
			[toolId]: value,
		};
		setTools(newState);

		setToolsSelectionMutation.mutate(
			{ tools: newState },
			{
				onError: () => {
					setTools((current) => {
						if (current[toolId] === value) {
							return {
								...current,
								[toolId]: previousValue,
							};
						}
						return current;
					});
					toast.error("Failed to save tool selection");
				},
			}
		);
	};

	const updateMcpServer = (serverId: string, value: boolean) => {
		const previousValue = mcpServersState[serverId];

		const newState = {
			...mcpServersState,
			[serverId]: value,
		};
		setMcpServersState(newState);

		setMcpServersSelectionMutation.mutate(
			{ servers: newState },
			{
				onError: () => {
					setMcpServersState((current) => {
						if (current[serverId] === value) {
							return {
								...current,
								[serverId]: previousValue,
							};
						}
						return current;
					});
					toast.error("Failed to save MCP server selection");
				},
			}
		);
	};

	const handleModeChange = (value: string) => {
		const newMode = value as ModeType;

		if (newMode === selectedMode) {
			return;
		}

		const previousMode = selectedMode;
		const previousAgent = selectedAgent;
		const previousTools = { ...tools };

		setSelectedMode(newMode);

		if (newMode === "ask") {
			setSelectedAgent(null);
			const defaultState = getDefaultToolsState();
			setTools(defaultState);

			setModeSelectionMutation.mutate(
				{ mode: newMode },
				{
					onError: () => {
						setSelectedMode(previousMode);
						setSelectedAgent(previousAgent);
						setTools(previousTools);
						toast.error("Failed to save mode selection");
					},
					onSuccess: () => {
						setToolsSelectionMutation.mutate(
							{ tools: defaultState },
							{
								onError: () => {
									setTools(previousTools);
									toast.error(
										"Failed to save tool selection"
									);
								},
							}
						);
					},
				}
			);
		} else if (newMode === "agent") {
			const clearedTools = Object.fromEntries(
				defaultTools.map((tool) => [tool.id, false])
			) as ToolsState;
			setTools(clearedTools);

			setModeSelectionMutation.mutate(
				{ mode: newMode },
				{
					onError: () => {
						setSelectedMode(previousMode);
						setSelectedAgent(previousAgent);
						setTools(previousTools);
						toast.error("Failed to save mode selection");
					},
					onSuccess: () => {
						setToolsSelectionMutation.mutate(
							{ tools: clearedTools },
							{
								onError: () => {
									setTools(previousTools);
									toast.error(
										"Failed to save tool selection"
									);
								},
							}
						);
					},
				}
			);
		}
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
				<Tabs onValueChange={handleModeChange} value={selectedMode}>
					<TabsList className="bg-neutral-950">
						{modeTypes.map((mode) => (
							<TabsTrigger
								className="text-xs"
								disabled={mode.disabled}
								key={mode.value}
								value={mode.value}
							>
								{mode.label}
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>
				{/* Dropdown for current mode options - placed outside tabs to avoid nested buttons */}
				{selectedMode === "ask" && (
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
											onCheckedChange={(checked) => {
												updateTool(tool.id, checked);
											}}
										/>
									</DropdownMenuItem>
								);
							})}

							{selectedMode === "ask" &&
								mcpServersData?.servers &&
								mcpServersData.servers.length > 0 && (
									<>
										<DropdownMenuSeparator className="bg-neutral-800" />
										<DropdownMenuLabel className="px-3 py-2 font-medium text-muted-foreground text-xs">
											MCP Servers
										</DropdownMenuLabel>
										{mcpServersData.servers.map(
											(server) => {
												const isChecked =
													mcpServersState[
														server.id
													] ?? false;
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
																<span className="truncate text-muted-foreground text-xs">
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
															) => {
																updateMcpServer(
																	server.id,
																	checked
																);
															}}
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
				{selectedMode === "agent" && (
					<DropdownMenu>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<DropdownMenuTrigger asChild>
										<Button
											aria-label="Research mode options"
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
							{Object.entries(
								modeTypes.find((m) => m.value === "agent")
									?.agents || {}
							).map(([agentKey, enabled]) => {
								if (!enabled) {
									return null;
								}
								const isSelected = selectedAgent === agentKey;
								return (
									<DropdownMenuItem
										className="flex cursor-pointer items-center justify-between p-3 hover:bg-neutral-800"
										key={agentKey}
										onSelect={(e) => {
											e.preventDefault();
											const newAgent =
												selectedAgent === agentKey
													? null
													: agentKey;
											const previousAgent = selectedAgent;

											setSelectedAgent(newAgent);

											setModeSelectionMutation.mutate(
												{
													mode: "agent",
													selectedAgent:
														newAgent || undefined,
												},
												{
													onError: () => {
														setSelectedAgent(
															(current) => {
																if (
																	current ===
																	newAgent
																) {
																	toast.error(
																		"Failed to save agent selection"
																	);
																	return previousAgent;
																}
																return current;
															}
														);
													},
												}
											);
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
			<div className="relative flex w-[200px] gap-2">
				<AnimatePresence initial={false}>
					{selectedMode === "ask" &&
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
													<div className="flex size-6 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900">
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
