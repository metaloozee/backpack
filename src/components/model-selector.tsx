'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { models } from '@/lib/models';
import Image from 'next/image';
import { useDebouncedCallback } from 'use-debounce';
import { useTRPC } from '@/lib/trpc/trpc';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BrainIcon, ChevronDown, RefreshCw, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Command, CommandList } from '@/components/ui/command';

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
    google: 'Gemini',
    anthropic: 'Claude',
    groq: 'Groq',
    openai: 'OpenAI',
};

const getProviderIcon = (provider: string) => {
    switch (provider) {
        case 'google':
            return <Image src="/icons/gemini-color.svg" alt="Google" width={16} height={16} />;
        case 'anthropic':
            return <Image src="/icons/claude-color.svg" alt="Anthropic" width={16} height={16} />;
        case 'groq':
            return (
                <Image className="invert" src="/icons/groq.svg" alt="Groq" width={16} height={16} />
            );
        case 'openai':
            return (
                <Image
                    className="invert"
                    src="/icons/openai.svg"
                    alt="OpenAI"
                    width={16}
                    height={16}
                />
            );
        default:
            return null;
    }
};

export function ModelSelector({ initialModel }: ModelSelectorProps) {
    const [selectedModel, setSelectedModel] = React.useState(initialModel ?? models[0].id);
    const [open, setOpen] = React.useState(false);

    const trpc = useTRPC();
    const setModelSelectionMutation = useMutation(trpc.chat.setModelSelection.mutationOptions());

    const handleModelChange = useDebouncedCallback(async (modelId: string) => {
        setSelectedModel(modelId);

        try {
            await setModelSelectionMutation.mutateAsync({ modelId });
        } catch (error) {
            toast.error('Failed to save model selection');
        }
    }, 500);

    const selectedModelData = models.find((model) => model.id === selectedModel);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="justify-between w-auto font-normal"
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
                                        <span>
                                            {providerNames[provider as keyof typeof providerNames]}
                                        </span>
                                    </div>
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent sideOffset={10} className="w-[200px] p-1">
                                    {providerModels.map((model) => (
                                        <DropdownMenuItem
                                            key={model.id}
                                            onSelect={() => handleModelChange(model.id)}
                                            className="cursor-pointer"
                                        >
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center gap-2">
                                                    {model.id === selectedModel && (
                                                        <Check className="size-3" />
                                                    )}
                                                    <span>{model.name}</span>
                                                </div>
                                                {model.reasoning && (
                                                    <Badge variant={'secondary'} className="px-1">
                                                        <BrainIcon className="size-3" />
                                                    </Badge>
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
