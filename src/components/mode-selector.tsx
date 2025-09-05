"use client";

import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { CheckIcon, ChevronDownIcon, TelescopeIcon } from "lucide-react";
import { type Dispatch, type SetStateAction, useState } from "react";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { defaultTools, getDefaultToolsState, type ToolsState } from "@/lib/ai/tools";
import { slideVariants, transitions } from "@/lib/animations";
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
		description: "Specialized for academic research",
		agents: {
			research: true,
		},
		disabled: false,
	},
] as const;

type ModeType = (typeof modeTypes)[number]["value"];

type ModeSelectorProps = {
	tools: ToolsState;
	setTools: Dispatch<SetStateAction<ToolsState>>;
	initialMode?: string;
	initialAgent?: string;
};

export function ModeSelector({ tools, setTools, initialMode, initialAgent }: ModeSelectorProps) {
	const [selectedMode, setSelectedMode] = useState<ModeType>((initialMode as ModeType) ?? "ask");
	const [selectedAgent, setSelectedAgent] = useState<string | null>(initialAgent ?? null);

	const trpc = useTRPC();
	const setToolsSelectionMutation = useMutation(trpc.chat.setToolsSelection.mutationOptions());
	const setModeSelectionMutation = useMutation(trpc.chat.setModeSelection.mutationOptions());

	const updateTool = useDebouncedCallback((toolId: string, value: boolean) => {
		setTools((prev) => {
			const newState = {
				...prev,
				[toolId]: value,
			};

			setToolsSelectionMutation.mutateAsync({ tools: newState }).catch(() => {
				toast.error("Failed to save tool selection");
			});

			return newState;
		});
	}, 500);

	const handleModeChange = useDebouncedCallback(async (value: string) => {
		const newMode = value as ModeType;
		setSelectedMode(newMode);

		if (newMode === "ask") {
			setSelectedAgent(null);
			const defaultState = getDefaultToolsState();
			setTools(defaultState);

			try {
				await setModeSelectionMutation.mutateAsync({ mode: newMode });
				await setToolsSelectionMutation.mutateAsync({ tools: defaultState });
			} catch {
				toast.error("Failed to save mode selection");
			}
		}

		if (newMode === "agent") {
			const clearedTools = Object.fromEntries(defaultTools.map((tool) => [tool.id, false])) as ToolsState;
			setTools(clearedTools);

			try {
				await setModeSelectionMutation.mutateAsync({ mode: newMode });
				await setToolsSelectionMutation.mutateAsync({ tools: clearedTools });
			} catch {
				toast.error("Failed to save mode selection");
			}
		}
	}, 500);

	return (
		<motion.div className="flex flex-row items-center justify-start gap-2" layout transition={transitions.smooth}>
			<motion.div animate="visible" initial="hidden" transition={transitions.smooth} variants={slideVariants.up}>
				<Tabs onValueChange={handleModeChange} value={selectedMode}>
					<TabsList className="bg-neutral-950">
						{modeTypes.map((mode) => (
							<TabsTrigger
								className="text-xs"
								disabled={mode.disabled}
								key={mode.value}
								value={mode.value}
							>
								<div className="inline-flex items-center gap-1">
									<span>{mode.label}</span>
									{(mode.value === "ask" || mode.value === "agent") && (
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												{/** biome-ignore lint/a11y/useSemanticElements: we need a span to be able to use the onClick event, using button causes hydration errors */}
												{/** biome-ignore lint/a11y/useFocusableInteractive: we need a span to be able to use the onClick event, using button causes hydration errors */}
												<span
													className={cn(
														"ml-1 inline-flex items-center justify-center rounded-sm",
														"hover:bg-neutral-900"
													)}
													onClick={(event) => {
														event.stopPropagation();
													}}
													onKeyDown={(event) => {
														if (event.key === "Enter" || event.key === " ") {
															event.stopPropagation();
														}
													}}
													onMouseDown={(event) => {
														event.stopPropagation();
													}}
													onPointerDown={(event) => {
														event.stopPropagation();
													}}
													role="button"
												>
													<ChevronDownIcon className="size-3" />
												</span>
											</DropdownMenuTrigger>
											{mode.value === "ask" ? (
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
												</DropdownMenuContent>
											) : (
												<DropdownMenuContent
													align="start"
													className="w-xs border-neutral-800 bg-neutral-950"
												>
													{Object.entries(
														modeTypes.find((m) => m.value === "agent")?.agents || {}
													).map(([agentKey, enabled]) => {
														if (!enabled) {
															return null;
														}
														const isSelected = selectedAgent === agentKey;
														return (
															<DropdownMenuItem
																className="flex cursor-pointer items-center justify-between p-3 hover:bg-neutral-800"
																key={agentKey}
																onSelect={async (e) => {
																	e.preventDefault();
																	const newAgent =
																		selectedAgent === agentKey ? null : agentKey;
																	setSelectedAgent(newAgent);

																	try {
																		await setModeSelectionMutation.mutateAsync({
																			mode: "agent",
																			selectedAgent: newAgent || undefined,
																		});
																	} catch {
																		toast.error("Failed to save agent selection");
																	}
																}}
															>
																<div className="flex items-center gap-3">
																	<TelescopeIcon className="size-4 text-muted-foreground" />
																	<div className="flex flex-col">
																		<span className="font-medium text-sm">
																			{agentKey.charAt(0).toUpperCase() +
																				agentKey.slice(1)}
																		</span>
																		<span className="text-muted-foreground text-xs">
																			{agentKey.charAt(0).toUpperCase() +
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
											)}
										</DropdownMenu>
									)}
								</div>
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>
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
										initial={{ opacity: 0, scale: 0.9, y: 2 }}
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
													<span className="text-xs">{t.name}</span>
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
