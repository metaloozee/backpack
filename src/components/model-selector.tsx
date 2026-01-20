"use client";

import { useMutation } from "@tanstack/react-query";
import {
	BrainIcon,
	Check,
	ChevronDown,
	ImageIcon,
	MicIcon,
	VideoIcon,
	WrenchIcon,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandList } from "@/components/ui/command";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { models } from "@/lib/ai/models";
import { useTRPC } from "@/lib/trpc/trpc";

interface ModelSelectorProps {
	initialModel?: string;
}

const groupedModels = models.reduce(
	(acc, model) => {
		if (!acc[model.provider]) {
			acc[model.provider] = [];
		}
		acc[model.provider].push(model);
		return acc;
	},
	{} as Record<string, typeof models>
);

const providerNames = {
	google: "Gemini",
	anthropic: "Claude",
	groq: "Groq",
	openai: "OpenAI",
	openrouter: "OpenRouter",
	mistral: "Mistral",
	cerebras: "Cerebras",
};

export function ModelSelector({ initialModel }: ModelSelectorProps) {
	const [selectedModel, setSelectedModel] = useState(
		initialModel ?? models[0].id
	);
	const [open] = useState(false);

	const trpc = useTRPC();
	const setModelSelectionMutation = useMutation(
		trpc.chat.setModelSelection.mutationOptions()
	);

	const handleModelChange = (modelId: string) => {
		if (modelId === selectedModel) {
			return;
		}

		const previousModel = selectedModel;

		setSelectedModel(modelId);

		setModelSelectionMutation.mutate(
			{ modelId },
			{
				onError: () => {
					setSelectedModel((curr) =>
						curr === modelId ? previousModel : curr
					);
					toast.error("Failed to save model selection");
				},
			}
		);
	};

	const selectedModelData = models.find(
		(model) => model.id === selectedModel
	);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					aria-expanded={open}
					className="w-auto justify-between font-normal"
					role="combobox"
					variant="outline"
				>
					<div className="flex items-center gap-2">
						<Image
							alt={selectedModelData?.provider ?? ""}
							className="dark:invert"
							height={20}
							src={`https://models.dev/logos/${selectedModelData?.provider}.svg`}
							width={20}
						/>
					</div>
					<ChevronDown className="size-3 shrink-0 opacity-50" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-[150px] p-1">
				<Command>
					<CommandList>
						{Object.entries(groupedModels).map(
							([provider, providerModels]) => (
								<DropdownMenuSub key={provider}>
									<DropdownMenuSubTrigger>
										<div className="flex items-center gap-2">
											<Image
												alt={
													selectedModelData?.provider ??
													""
												}
												className="dark:invert"
												height={20}
												src={`https://models.dev/logos/${provider}.svg`}
												width={20}
											/>
											<span>
												{
													providerNames[
														provider as keyof typeof providerNames
													]
												}
											</span>
										</div>
									</DropdownMenuSubTrigger>
									<DropdownMenuSubContent
										className="w-auto p-1"
										sideOffset={10}
									>
										{providerModels.map((model) => (
											<DropdownMenuItem
												className="cursor-pointer"
												key={model.id}
												onSelect={() =>
													handleModelChange(model.id)
												}
											>
												<div className="flex w-full items-center justify-between gap-5">
													<div className="flex items-center gap-2">
														{model.id ===
															selectedModel && (
															<Check className="size-3" />
														)}
														<span>
															{model.name}
														</span>
													</div>
													<TooltipProvider>
														<div className="flex flex-row gap-1">
															{model.capabilities
																.reasoning && (
																<Tooltip>
																	<TooltipTrigger
																		asChild
																	>
																		<Badge
																			className="px-1"
																			variant="secondary"
																		>
																			<BrainIcon className="size-3" />
																		</Badge>
																	</TooltipTrigger>
																	<TooltipContent>
																		<span className="text-xs">
																			Reasoning
																		</span>
																	</TooltipContent>
																</Tooltip>
															)}
															{model.capabilities
																.toolCall && (
																<Tooltip>
																	<TooltipTrigger
																		asChild
																	>
																		<Badge
																			className="px-1"
																			variant="secondary"
																		>
																			<WrenchIcon className="size-3" />
																		</Badge>
																	</TooltipTrigger>
																	<TooltipContent>
																		<span className="text-xs">
																			Tool
																			Use
																		</span>
																	</TooltipContent>
																</Tooltip>
															)}
															{model.modalities.input.includes(
																"image"
															) && (
																<Tooltip>
																	<TooltipTrigger
																		asChild
																	>
																		<Badge
																			className="px-1"
																			variant="secondary"
																		>
																			<ImageIcon className="size-3" />
																		</Badge>
																	</TooltipTrigger>
																	<TooltipContent>
																		<span className="text-xs">
																			Vision
																		</span>
																	</TooltipContent>
																</Tooltip>
															)}
															{model.modalities.input.includes(
																"audio"
															) && (
																<Tooltip>
																	<TooltipTrigger
																		asChild
																	>
																		<Badge
																			className="px-1"
																			variant="secondary"
																		>
																			<MicIcon className="size-3" />
																		</Badge>
																	</TooltipTrigger>
																	<TooltipContent>
																		<span className="text-xs">
																			Audio
																		</span>
																	</TooltipContent>
																</Tooltip>
															)}
															{model.modalities.input.includes(
																"video"
															) && (
																<Tooltip>
																	<TooltipTrigger
																		asChild
																	>
																		<Badge
																			className="px-1"
																			variant="secondary"
																		>
																			<VideoIcon className="size-3" />
																		</Badge>
																	</TooltipTrigger>
																	<TooltipContent>
																		<span className="text-xs">
																			Video
																		</span>
																	</TooltipContent>
																</Tooltip>
															)}
														</div>
													</TooltipProvider>
												</div>
											</DropdownMenuItem>
										))}
									</DropdownMenuSubContent>
								</DropdownMenuSub>
							)
						)}
					</CommandList>
				</Command>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
