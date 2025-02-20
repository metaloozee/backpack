'use client';

import { motion, AnimatePresence } from 'motion/react';
import { ToolInvocation } from 'ai';
import { cn } from '@/lib/utils';
import { CircleCheckBigIcon, Loader2Icon } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ToolProps {
    tool: {
        type: 'tool_call';
        data: {
            toolCallId: string;
            toolName: string;
            state: 'call' | 'result';
            args: string;
            result?: string;
        };
    };
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
}

const toolAnimation = {
    initial: { y: 5, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { opacity: 0 },
    transition: {
        duration: 0.3,
        ease: [0.32, 0.72, 0, 1],
    },
};

const ToolComponents: Record<string, React.FC<ToolProps>> = {
    web_search: ({ tool }) => (
        <motion.div {...toolAnimation} className="flex gap-1 items-center">
            {tool.data.state === 'result' ? (
                <HoverCard openDelay={0}>
                    <HoverCardTrigger asChild>
                        <div className="flex gap-1 items-center text-xs text-muted-foreground cursor-pointer">
                            <CircleCheckBigIcon className="size-3" />
                            Web Search Results
                        </div>
                    </HoverCardTrigger>
                    <HoverCardContent side="right" sideOffset={10} className="max-w-2xl w-full">
                        <ScrollArea className="h-[30vh] w-full text-xs">
                            {tool.data.result && (
                                <div className="space-y-2">
                                    <p>{tool.data.result}</p>
                                </div>
                            )}
                        </ScrollArea>
                    </HoverCardContent>
                </HoverCard>
            ) : (
                <div className="flex gap-1 items-center skeleton animate-pulse text-xs text-zinc-400">
                    <Loader2Icon className="size-3 animate-spin" />
                    Searching the web...
                </div>
            )}
        </motion.div>
    ),
    retrieve: ({ tool }) => (
        <motion.div {...toolAnimation} className="flex gap-1 items-center">
            {tool.data.state === 'result' ? (
                <HoverCard openDelay={0}>
                    <HoverCardTrigger asChild>
                        <div className="flex gap-1 items-center text-xs text-muted-foreground cursor-pointer">
                            <CircleCheckBigIcon className="size-3" />
                            Retrieved Information
                        </div>
                    </HoverCardTrigger>
                    <HoverCardContent side="right" sideOffset={10} className="max-w-2xl w-full">
                        <ScrollArea className="h-[30vh] w-full text-xs">
                            {tool.data.result && (
                                <div className="space-y-2">
                                    <p>{tool.data.result}</p>
                                </div>
                            )}
                        </ScrollArea>
                    </HoverCardContent>
                </HoverCard>
            ) : (
                <div className="flex gap-1 items-center skeleton animate-pulse text-xs text-zinc-400">
                    <Loader2Icon className="size-3 animate-spin" />
                    Retrieving information...
                </div>
            )}
        </motion.div>
    ),
    default: ({ tool }) => {
        const formatToolName = (name?: string) => {
            if (!name) return 'Tool';
            return name
                .split('_')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        };

        const formatResult = (result: any) => {
            if (!result) return '';
            if (typeof result === 'string') return result;
            if (Array.isArray(result)) {
                return result.map((item, i) => (
                    <div key={i} className="mb-2">
                        {formatResult(item)}
                    </div>
                ));
            }
            if (typeof result === 'object') {
                return JSON.stringify(result, null, 2);
            }
            return String(result);
        };

        return (
            <motion.div {...toolAnimation} className="flex gap-1 items-center">
                {tool.data.state === 'result' ? (
                    <HoverCard openDelay={0}>
                        <HoverCardTrigger asChild>
                            <div className="flex gap-1 items-center text-xs text-muted-foreground cursor-pointer">
                                <CircleCheckBigIcon className="size-3" />
                                {formatToolName(tool.data.toolName)}
                            </div>
                        </HoverCardTrigger>
                        <HoverCardContent side="right" sideOffset={10} className="max-w-2xl w-full">
                            <ScrollArea className="h-[30vh] w-full text-xs">
                                {tool.data.result && (
                                    <div className="space-y-2">
                                        <p>{formatResult(tool.data.result)}</p>
                                    </div>
                                )}
                            </ScrollArea>
                        </HoverCardContent>
                    </HoverCard>
                ) : (
                    <div className="flex gap-1 items-center skeleton animate-pulse text-xs text-zinc-400">
                        <Loader2Icon className="size-3 animate-spin" />
                        Running {formatToolName(tool.data.toolName)}...
                    </div>
                )}
            </motion.div>
        );
    },
};

export function Tool({ tool, isOpen, onOpenChange }: ToolProps) {
    if (!tool?.data?.toolName) {
        return null;
    }
    const ToolComponent = ToolComponents[tool.data.toolName] || ToolComponents.default;
    return (
        <AnimatePresence mode="wait">
            <motion.div>
                <ToolComponent tool={tool} isOpen={isOpen} onOpenChange={onOpenChange} />
            </motion.div>
        </AnimatePresence>
    );
}
