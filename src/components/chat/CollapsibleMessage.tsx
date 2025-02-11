import { cn } from '@/lib/utils';
import { Bot, User, ChevronDown } from 'lucide-react';
import {
    Collapsible,
    CollapsibleContent as RadixCollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'motion/react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface CollapsibleMessageProps {
    children: React.ReactNode;
    role: 'user' | 'assistant';
    isCollapsible?: boolean;
    isOpen?: boolean;
    header?: React.ReactNode;
    onOpenChange?: (open: boolean) => void;
    showBorder?: boolean;
    showIcon?: boolean;
}

const MessageIcon = ({ role, showIcon }: { role: 'user' | 'assistant'; showIcon: boolean }) => {
    if (!showIcon) return null;

    return (
        <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="size-[24px] rounded-lg flex-shrink-0"
        >
            {role === 'user' ? (
                <Avatar>
                    <AvatarFallback className="text-xs">
                        <User />
                    </AvatarFallback>
                </Avatar>
            ) : (
                <Bot />
            )}
        </motion.div>
    );
};

const CollapsibleWrapper = ({
    children,
    isCollapsible,
    header,
    isOpen,
    onOpenChange,
}: {
    children: React.ReactNode;
    isCollapsible: boolean;
    header?: React.ReactNode;
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
}) => {
    if (!isCollapsible) {
        return (
            <motion.div
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                className="flex-1 px-4 hover:bg-zinc-900/10 transition-colors duration-200"
            >
                {children}
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="flex-1 p-4 border border-border/50 hover:border-border/80 transition-all duration-200"
        >
            <Collapsible open={isOpen} onOpenChange={onOpenChange} className="w-full">
                <CollapsibleTrigger className="flex items-center justify-between w-full group">
                    <div className="flex items-center justify-between w-full gap-2">
                        {header && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-sm w-full text-zinc-800 dark:text-zinc-300"
                            >
                                {header}
                            </motion.div>
                        )}
                        <motion.div
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </motion.div>
                    </div>
                </CollapsibleTrigger>
                <RadixCollapsibleContent className="data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down">
                    <Separator className="my-4 border-border/50" />
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {children}
                    </motion.div>
                </RadixCollapsibleContent>
            </Collapsible>
        </motion.div>
    );
};

export function CollapsibleMessage({
    children,
    role,
    isCollapsible = false,
    isOpen = true,
    header,
    onOpenChange,
    showBorder = true,
    showIcon = true,
}: CollapsibleMessageProps) {
    const content = (
        <motion.div
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="py-2 flex-1"
        >
            {children}
        </motion.div>
    );

    return (
        <motion.div
            layout
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={cn('flex gap-4 px-4 w-full max-w-2xl', role === 'user' && 'mt-10 mb-5')}
        >
            <div className="relative flex flex-col items-start">
                <MessageIcon role={role} showIcon={showIcon} />
            </div>

            <CollapsibleWrapper
                isCollapsible={isCollapsible}
                header={header}
                isOpen={isOpen}
                onOpenChange={onOpenChange}
            >
                {content}
            </CollapsibleWrapper>
        </motion.div>
    );
}
