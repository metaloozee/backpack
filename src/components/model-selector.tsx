"use client";

import { useMutation } from "@tanstack/react-query";
import { BrainIcon, Check, ChevronDown, FlaskConicalIcon, RocketIcon, ShieldIcon, SparklesIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";
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
import { models } from "@/lib/ai/models";
import { useTRPC } from "@/lib/trpc/trpc";

type ModelSelectorProps = {
	initialModel?: string;
};

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

const getProviderIcon = (provider: string) => {
	switch (provider) {
		case "google":
			return <Image alt="Google" height={16} src="/icons/gemini-color.svg" width={16} />;
		case "anthropic":
			return <Image alt="Anthropic" height={16} src="/icons/claude-color.svg" width={16} />;
		case "groq":
			return <Image alt="Groq" className="invert" height={16} src="/icons/groq.svg" width={16} />;
		case "openrouter":
			return <Image alt="OpenRouter" className="invert" height={16} src="/icons/openrouter.svg" width={16} />;
		case "openai":
			return <Image alt="OpenAI" className="invert" height={16} src="/icons/openai.svg" width={16} />;
		case "mistral":
			return <Image alt="Mistral" height={16} src="/icons/mistral-color.svg" width={16} />;
		default:
			return null;
	}
};

export function ModelSelector({ initialModel }: ModelSelectorProps) {
	const [selectedModel, setSelectedModel] = useState(initialModel ?? models[0].id);
	const [open] = useState(false);

	const trpc = useTRPC();
	const setModelSelectionMutation = useMutation(trpc.chat.setModelSelection.mutationOptions());

	const handleModelChange = useDebouncedCallback(async (modelId: string) => {
		setSelectedModel(modelId);

		try {
			await setModelSelectionMutation.mutateAsync({ modelId });
		} catch {
			toast.error("Failed to save model selection");
		}
	}, 500);

	const selectedModelData = models.find((model) => model.id === selectedModel);

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
						{selectedModelData && getProviderIcon(selectedModelData.provider)}
					</div>
					<ChevronDown className="size-3 shrink-0 opacity-50" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-[150px] p-1">
				<Command>
					<CommandList>
						{Object.entries(groupedModels).map(([provider, providerModels]) => (
							<DropdownMenuSub key={provider}>
								<DropdownMenuSubTrigger>
									<div className="flex items-center gap-2">
										{getProviderIcon(provider)}
										<span>{providerNames[provider as keyof typeof providerNames]}</span>
									</div>
								</DropdownMenuSubTrigger>
								<DropdownMenuSubContent className="w-auto p-1" sideOffset={10}>
									{providerModels.map((model) => (
										<DropdownMenuItem
											className="cursor-pointer"
											key={model.id}
											onSelect={() => handleModelChange(model.id)}
										>
											<div className="flex w-full items-center justify-between gap-5">
												<div className="flex items-center gap-2">
													{model.id === selectedModel && <Check className="size-3" />}
													<span>{model.name}</span>
												</div>
												{model.properties && (
													<div className="flex flex-row gap-1">
														{model.properties.includes("reasoning") && (
															<Badge className="px-1" variant={"secondary"}>
																<BrainIcon className="size-3" />
															</Badge>
														)}
														{model.properties.includes("fast") && (
															<Badge className="px-1" variant={"secondary"}>
																<RocketIcon className="size-3" />
															</Badge>
														)}
														{model.properties.includes("quality") && (
															<Badge className="px-1" variant={"secondary"}>
																<SparklesIcon className="size-3" />
															</Badge>
														)}
														{model.properties.includes("experimental") && (
															<Badge className="px-1" variant={"secondary"}>
																<FlaskConicalIcon className="size-3" />
															</Badge>
														)}
														{model.properties.includes("stealth") && (
															<Badge className="px-1" variant={"secondary"}>
																<ShieldIcon className="size-3" />
															</Badge>
														)}
													</div>
												)}
											</div>
										</DropdownMenuItem>
									))}
								</DropdownMenuSubContent>
							</DropdownMenuSub>
						))}
					</CommandList>
				</Command>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
