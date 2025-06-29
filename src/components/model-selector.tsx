'use client';

import * as React from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { models } from '@/lib/models';
import Image from 'next/image';
import { useDebouncedCallback } from 'use-debounce';
import { useTRPC } from '@/lib/trpc/trpc';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ModelSelectorProps {
    initialModel?: string;
}

export function ModelSelector({ initialModel }: ModelSelectorProps) {
    const [selectedModel, setSelectedModel] = React.useState(initialModel ?? models[0].id);

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

    const selectedModelProvider = models.find((model) => model.id === selectedModel)?.provider;

    return (
        <Select value={selectedModel} onValueChange={handleModelChange}>
            <SelectTrigger className="w-auto bg-transparent focus:ring-0 focus:ring-offset-0">
                {selectedModelProvider === 'google' && (
                    <Image src="/icons/google.svg" alt="Google" width={16} height={16} />
                )}
                {selectedModelProvider === 'anthropic' && (
                    <Image src="/icons/anthropic.svg" alt="Anthropic" width={16} height={16} />
                )}
            </SelectTrigger>
            <SelectContent>
                {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                        <div className="flex items-center gap-2">
                            {model.provider === 'google' && (
                                <Image
                                    src="/icons/google.svg"
                                    alt="Google"
                                    width={16}
                                    height={16}
                                />
                            )}
                            {model.provider === 'anthropic' && (
                                <Image
                                    src="/icons/anthropic.svg"
                                    alt="Anthropic"
                                    width={16}
                                    height={16}
                                />
                            )}
                            {model.name}
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
