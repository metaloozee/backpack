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
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
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
import {
	availableModels,
	getModel,
	type Model,
	normalizeModelId,
} from "@/lib/ai/models";
import { useIsMobile } from "@/lib/hooks/use-mobile";
import { usePrefsStore } from "@/lib/store/store";
import { usePrefsHydrated } from "@/lib/store/use-prefs-hydrated";
import { cn } from "@/lib/utils";

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
	nvidia: "NVIDIA",
};

const drawerSurface =
	"border-border bg-popover dark:border-neutral-800 dark:bg-neutral-950";

function ModelCapabilityBadges({ model }: { model: Model }) {
	return (
		<TooltipProvider>
			<div className="flex shrink-0 flex-row gap-1">
				{model.capabilities.reasoning && (
					<Tooltip>
						<TooltipTrigger asChild>
							<Badge className="px-1" variant="secondary">
								<BrainIcon className="size-3" />
							</Badge>
						</TooltipTrigger>
						<TooltipContent>
							<span className="text-xs">Reasoning</span>
						</TooltipContent>
					</Tooltip>
				)}
				{model.capabilities.toolCall && (
					<Tooltip>
						<TooltipTrigger asChild>
							<Badge className="px-1" variant="secondary">
								<WrenchIcon className="size-3" />
							</Badge>
						</TooltipTrigger>
						<TooltipContent>
							<span className="text-xs">Tool Use</span>
						</TooltipContent>
					</Tooltip>
				)}
				{model.modalities.input.includes("image") && (
					<Tooltip>
						<TooltipTrigger asChild>
							<Badge className="px-1" variant="secondary">
								<ImageIcon className="size-3" />
							</Badge>
						</TooltipTrigger>
						<TooltipContent>
							<span className="text-xs">Vision</span>
						</TooltipContent>
					</Tooltip>
				)}
				{model.modalities.input.includes("audio") && (
					<Tooltip>
						<TooltipTrigger asChild>
							<Badge className="px-1" variant="secondary">
								<MicIcon className="size-3" />
							</Badge>
						</TooltipTrigger>
						<TooltipContent>
							<span className="text-xs">Audio</span>
						</TooltipContent>
					</Tooltip>
				)}
				{model.modalities.input.includes("video") && (
					<Tooltip>
						<TooltipTrigger asChild>
							<Badge className="px-1" variant="secondary">
								<VideoIcon className="size-3" />
							</Badge>
						</TooltipTrigger>
						<TooltipContent>
							<span className="text-xs">Video</span>
						</TooltipContent>
					</Tooltip>
				)}
			</div>
		</TooltipProvider>
	);
}

function ProviderLogo({
	provider,
	size = 20,
}: {
	provider: string;
	size?: number;
}) {
	return (
		<Image
			alt=""
			aria-hidden
			className="dark:invert"
			height={size}
			src={`https://models.dev/logos/${provider}.svg`}
			width={size}
		/>
	);
}

export function ModelSelector({ initialModelId }: { initialModelId?: string }) {
	const isMobile = useIsMobile();
	const hasHydrated = usePrefsHydrated();
	const modelId = usePrefsStore((s) => s.modelId);
	const setModelId = usePrefsStore((s) => s.setModelId);
	const [desktopOpen, setDesktopOpen] = useState(false);
	const [drawerOpen, setDrawerOpen] = useState(false);
	const listboxId = useId();
	const selectedModelId = normalizeModelId(
		hasHydrated ? modelId : (initialModelId ?? modelId)
	);
	const selectedModelData = getModel(selectedModelId) ?? availableModels[0];
	const provider = selectedModelData?.provider ?? "openai";

	const selectModel = (id: string) => {
		setModelId(id);
		if (isMobile) {
			setDrawerOpen(false);
		} else {
			setDesktopOpen(false);
		}
	};

	const trigger = (
		<Button
			aria-controls={listboxId}
			aria-expanded={isMobile ? drawerOpen : desktopOpen}
			aria-label={`Selected model: ${selectedModelData.name}`}
			role="combobox"
			size="icon"
			type="button"
			variant="outline"
		>
			<ProviderLogo provider={provider} />
		</Button>
	);

	if (isMobile) {
		return (
			<Drawer
				direction="bottom"
				onOpenChange={setDrawerOpen}
				open={drawerOpen}
				shouldScaleBackground={false}
			>
				<DrawerTrigger asChild>{trigger}</DrawerTrigger>
				<DrawerContent
					className={cn("max-h-[min(82vh,640px)]", drawerSurface)}
					id={listboxId}
				>
					<DrawerHeader className="space-y-1 px-4 pt-2 pb-3 text-left">
						<DrawerTitle className="font-semibold text-base tracking-tight">
							Model
						</DrawerTitle>
					</DrawerHeader>
					<div className="max-h-[min(58vh,480px)] overflow-y-auto overscroll-contain px-2 pb-[max(1rem,var(--safe-area-bottom))]">
						{Object.entries(groupedModels).map(
							([providerKey, providerModels]) => (
								<section
									className="mb-3 last:mb-1"
									key={providerKey}
								>
									<div className="sticky top-0 z-10 flex items-center gap-2 border-border/60 border-b bg-popover/95 px-2 py-2 backdrop-blur-sm dark:border-white/10 dark:bg-neutral-950/95">
										<ProviderLogo
											provider={providerKey}
											size={18}
										/>
										<span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
											{providerNames[providerKey] ??
												providerKey}
										</span>
									</div>
									<div className="mt-1 flex flex-col gap-0.5">
										{providerModels.map((model) => {
											const selected =
												model.id === selectedModelId;
											return (
												<button
													aria-label={model.name}
													className={cn(
														"flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-accent dark:hover:bg-neutral-800",
														selected &&
															"bg-accent/80 dark:bg-neutral-800/80"
													)}
													key={model.id}
													onClick={() =>
														selectModel(model.id)
													}
													type="button"
												>
													<div className="flex min-w-0 flex-1 items-center gap-2">
														{selected ? (
															<Check className="size-3.5 shrink-0 text-primary" />
														) : (
															<span className="inline-block size-3.5 shrink-0" />
														)}
														<code className="truncate font-mono text-[11px] text-foreground/90 leading-tight">
															{model.id}
														</code>
													</div>
													<ModelCapabilityBadges
														model={model}
													/>
												</button>
											);
										})}
									</div>
								</section>
							)
						)}
					</div>
				</DrawerContent>
			</Drawer>
		);
	}

	return (
		<DropdownMenu onOpenChange={setDesktopOpen} open={desktopOpen}>
			<DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
			<DropdownMenuContent
				className="w-[min(100vw-2rem,280px)] p-1"
				id={listboxId}
			>
				<Command>
					<CommandList>
						{Object.entries(groupedModels).map(
							([providerKey, providerModels]) => (
								<DropdownMenuSub key={providerKey}>
									<DropdownMenuSubTrigger className="gap-2">
										<ProviderLogo provider={providerKey} />
										<span>
											{providerNames[providerKey]}
										</span>
									</DropdownMenuSubTrigger>
									<DropdownMenuSubContent
										className="w-auto max-w-[min(100vw-2rem,320px)] p-1"
										sideOffset={10}
									>
										{providerModels.map((model) => (
											<DropdownMenuItem
												aria-label={model.name}
												className="cursor-pointer gap-2"
												key={model.id}
												onSelect={() =>
													selectModel(model.id)
												}
											>
												<div className="flex w-full min-w-0 items-center justify-between gap-3">
													<div className="flex min-w-0 flex-1 items-center gap-2">
														{model.id ===
															selectedModelId && (
															<Check className="size-3 shrink-0" />
														)}
														<code className="truncate font-mono text-[11px] text-foreground/90">
															{model.id}
														</code>
													</div>
													<ModelCapabilityBadges
														model={model}
													/>
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
