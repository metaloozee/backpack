'use client';

import { motion, AnimatePresence } from 'motion/react';
import { ToolInvocation } from 'ai';
import { cn } from '@/lib/utils';
import { CircleCheckBigIcon, Loader2Icon } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ToolProps {
    tool: ToolInvocation;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
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
            {tool.state === 'result' ? (
                <HoverCard openDelay={0}>
                    <HoverCardTrigger asChild>
                        <div className="flex gap-1 items-center text-xs text-muted-foreground cursor-pointer">
                            <CircleCheckBigIcon className="size-3" />
                            Web Search Results
                        </div>
                    </HoverCardTrigger>
                    <HoverCardContent side="right" sideOffset={10} className="max-w-2xl w-full">
                        <ScrollArea className="h-[30vh] w-full text-xs">
                            {tool.result && (
                                <div className="space-y-2">
                                    <p>{tool.result}</p>
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
            {tool.state === 'result' ? (
                <HoverCard openDelay={0}>
                    <HoverCardTrigger asChild>
                        <div className="flex gap-1 items-center text-xs text-muted-foreground cursor-pointer">
                            <CircleCheckBigIcon className="size-3" />
                            Retrieved Information
                        </div>
                    </HoverCardTrigger>
                    <HoverCardContent side="right" sideOffset={10} className="max-w-2xl w-full">
                        <ScrollArea className="h-[30vh] w-full text-xs">
                            {tool.result && (
                                <div className="space-y-2">
                                    <p>{tool.result}</p>
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
};

export function Tool({ tool, isOpen, onOpenChange }: ToolProps) {
    const ToolComponent = ToolComponents[tool.toolName];

    if (!ToolComponent) {
        return null;
    }

    return (
        <AnimatePresence mode="wait">
            <motion.div
                layout
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={cn(
                    'w-full transition-all duration-200',
                    isOpen ? 'opacity-100' : 'opacity-50'
                )}
            >
                <ToolComponent tool={tool} isOpen={isOpen} onOpenChange={onOpenChange} />
            </motion.div>
        </AnimatePresence>
    );
}
