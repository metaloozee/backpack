'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TelescopeIcon, ChevronDownIcon, CheckIcon } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { layoutTransition, slideVariants, transitions } from '@/lib/animations';
import { defaultTools, getDefaultToolsState, type ToolsState } from '@/lib/ai/tools';
import { Dispatch, SetStateAction } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { useTRPC } from '@/lib/trpc/trpc';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

const modeTypes = [
    {
        value: 'ask',
        label: 'Ask',
        description: 'Standard mode with all features',
        tools: {
            webSearch: true,
            knowledgeSearch: true,
            academicSearch: true,
            financeSearch: true,
        },
        disabled: false,
    },
    {
        value: 'agent',
        label: 'Agent',
        description: 'Specialized for academic research',
        agents: {
            research: true,
        },
        disabled: false,
    },
] as const;

type ModeType = (typeof modeTypes)[number]['value'];

interface ModeSelectorProps {
    tools: ToolsState;
    setTools: Dispatch<SetStateAction<ToolsState>>;
    initialMode?: string;
    initialAgent?: string;
}

export function ModeSelector({ tools, setTools, initialMode, initialAgent }: ModeSelectorProps) {
    const [selectedMode, setSelectedMode] = React.useState<ModeType>(
        (initialMode as ModeType) ?? 'ask'
    );
    const [selectedAgent, setSelectedAgent] = React.useState<string | null>(initialAgent ?? null);

    const trpc = useTRPC();
    const setToolsSelectionMutation = useMutation(trpc.chat.setToolsSelection.mutationOptions());
    const setModeSelectionMutation = useMutation(trpc.chat.setModeSelection.mutationOptions());

    const updateTool = useDebouncedCallback(async (toolId: string, value: boolean) => {
        setTools((prev) => {
            const newState = {
                ...prev,
                [toolId]: value,
            };

            setToolsSelectionMutation.mutateAsync({ tools: newState }).catch(() => {
                toast.error('Failed to save tool selection');
            });

            return newState;
        });
    }, 500);

    const handleModeChange = useDebouncedCallback(async (value: string) => {
        const newMode = value as ModeType;
        setSelectedMode(newMode);

        if (newMode === 'ask') {
            setSelectedAgent(null);
            const defaultState = getDefaultToolsState();
            setTools(defaultState);

            try {
                await setModeSelectionMutation.mutateAsync({ mode: newMode });
                await setToolsSelectionMutation.mutateAsync({ tools: defaultState });
            } catch (error) {
                toast.error('Failed to save mode selection');
            }
        }

        if (newMode === 'agent') {
            const clearedTools = Object.fromEntries(
                defaultTools.map((tool) => [tool.id, false])
            ) as ToolsState;
            setTools(clearedTools);

            try {
                await setModeSelectionMutation.mutateAsync({ mode: newMode });
                await setToolsSelectionMutation.mutateAsync({ tools: clearedTools });
            } catch (error) {
                toast.error('Failed to save mode selection');
            }
        }
    }, 500);

    return (
        <motion.div
            layout
            className="flex flex-row justify-start items-center gap-2"
            transition={transitions.smooth}
        >
            <motion.div
                variants={slideVariants.up}
                initial="hidden"
                animate="visible"
                transition={transitions.smooth}
            >
                <Tabs value={selectedMode} onValueChange={handleModeChange}>
                    <TabsList className="bg-neutral-950">
                        {modeTypes.map((mode) => (
                            <TabsTrigger
                                key={mode.value}
                                value={mode.value}
                                disabled={mode.disabled}
                                className="text-xs"
                            >
                                <div className="inline-flex items-center gap-1">
                                    <span>{mode.label}</span>
                                    {(mode.value === 'ask' || mode.value === 'agent') && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <span
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                    }}
                                                    onMouseDown={(event) => {
                                                        event.stopPropagation();
                                                    }}
                                                    onPointerDown={(event) => {
                                                        event.stopPropagation();
                                                    }}
                                                    className={cn(
                                                        'ml-1 inline-flex items-center justify-center rounded-sm ',
                                                        'hover:bg-neutral-900'
                                                    )}
                                                    role="button"
                                                    tabIndex={0}
                                                >
                                                    <ChevronDownIcon className="size-3" />
                                                </span>
                                            </DropdownMenuTrigger>
                                            {mode.value === 'ask' ? (
                                                <DropdownMenuContent
                                                    align="start"
                                                    className="w-xs bg-neutral-950 border-neutral-800"
                                                >
                                                    {defaultTools.map((tool) => {
                                                        const IconComponent = tool.icon;
                                                        const isChecked = tools[tool.id] || false;
                                                        return (
                                                            <DropdownMenuItem
                                                                key={tool.id}
                                                                className="flex items-center justify-between p-3 cursor-pointer hover:bg-neutral-800"
                                                                onClick={(e) => e.preventDefault()}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <IconComponent className="size-4 text-muted-foreground" />
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm font-medium">
                                                                            {tool.name}
                                                                        </span>
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {tool.description}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <Switch
                                                                    key={`tool-switch-${tool.id}-${isChecked}`}
                                                                    checked={isChecked}
                                                                    onCheckedChange={(checked) => {
                                                                        updateTool(
                                                                            tool.id,
                                                                            checked
                                                                        );
                                                                    }}
                                                                />
                                                            </DropdownMenuItem>
                                                        );
                                                    })}
                                                </DropdownMenuContent>
                                            ) : (
                                                <DropdownMenuContent
                                                    align="start"
                                                    className="w-xs bg-neutral-950 border-neutral-800"
                                                >
                                                    {Object.entries(
                                                        modeTypes.find((m) => m.value === 'agent')
                                                            ?.agents || {}
                                                    ).map(([agentKey, enabled]) => {
                                                        if (!enabled) return null;
                                                        const isSelected =
                                                            selectedAgent === agentKey;
                                                        return (
                                                            <DropdownMenuItem
                                                                key={agentKey}
                                                                className="flex items-center justify-between p-3 cursor-pointer hover:bg-neutral-800"
                                                                onSelect={async (e) => {
                                                                    e.preventDefault();
                                                                    const newAgent =
                                                                        selectedAgent === agentKey
                                                                            ? null
                                                                            : agentKey;
                                                                    setSelectedAgent(newAgent);

                                                                    try {
                                                                        await setModeSelectionMutation.mutateAsync(
                                                                            {
                                                                                mode: 'agent',
                                                                                selectedAgent:
                                                                                    newAgent ||
                                                                                    undefined,
                                                                            }
                                                                        );
                                                                    } catch (error) {
                                                                        toast.error(
                                                                            'Failed to save agent selection'
                                                                        );
                                                                    }
                                                                }}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <TelescopeIcon className="size-4 text-muted-foreground" />
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm font-medium">
                                                                            {agentKey
                                                                                .charAt(0)
                                                                                .toUpperCase() +
                                                                                agentKey.slice(1)}
                                                                        </span>
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {agentKey
                                                                                .charAt(0)
                                                                                .toUpperCase() +
                                                                                agentKey.slice(
                                                                                    1
                                                                                )}{' '}
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
            <div className="relative flex gap-2 w-[200px]">
                <AnimatePresence initial={false}>
                    {selectedMode === 'ask' &&
                        defaultTools
                            .filter((t) => tools[t.id])
                            .map((t) => {
                                const Icon = t.icon;
                                return (
                                    <motion.div
                                        key={`selected-tool-${t.id}-${tools[t.id]}`}
                                        initial={{ opacity: 0, scale: 0.9, y: 2 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: -2 }}
                                        transition={transitions.smooth}
                                        layout
                                    >
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="size-6 rounded-full border border-neutral-800 bg-neutral-900 flex items-center justify-center">
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
