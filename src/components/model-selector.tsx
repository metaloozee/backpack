"use client";

import {
	BrainIcon,
	Check,
	ImageIcon,
	MicIcon,
	VideoIcon,
	WrenchIcon,
} from "lucide-react";
import Image from "next/image";
import { useId, useState } from "react";
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
import { availableModels, getModel, normalizeModelId } from "@/lib/ai/models";
import { usePrefsStore } from "@/lib/store/store";

const groupedModels = availableModels.reduce(
	(acc, model) => {
		if (!acc[model.provider]) {
			acc[model.provider] = [];
		}
		acc[model.provider].push(model);
		return acc;
	},
	{} as Record<string, typeof availableModels>
);

const providerNames: Record<string, string> = {
	google: "Gemini",
	anthropic: "Claude",
	groq: "Groq",
	openai: "OpenAI",
	openrouter: "OpenRouter",
	mistral: "Mistral",
	cerebras: "Cerebras",
};

export function ModelSelector() {
	const modelId = usePrefsStore((s) => s.modelId);
	const setModelId = usePrefsStore((s) => s.setModelId);
	const [open] = useState(false);
	const listboxId = useId();
	const selectedModelId = normalizeModelId(modelId);
	const selectedModelData = getModel(selectedModelId) ?? availableModels[0];

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					aria-controls={listboxId}
					aria-expanded={open}
					className="w-auto justify-between font-normal"
					role="combobox"
					size={"sm"}
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
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-[150px] p-1" id={listboxId}>
				<Command>
					<CommandList>
						{Object.entries(groupedModels).map(
							([provider, providerModels]) => (
								<DropdownMenuSub key={provider}>
									<DropdownMenuSubTrigger>
										<div className="flex items-center gap-2">
											<Image
												alt={provider}
												className="dark:invert"
												height={20}
												src={`https://models.dev/logos/${provider}.svg`}
												width={20}
											/>
											<span>
												{providerNames[provider]}
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
													setModelId(model.id)
												}
											>
												<div className="flex w-full items-center justify-between gap-5">
													<div className="flex items-center gap-2">
														{model.id ===
															selectedModelId && (
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
