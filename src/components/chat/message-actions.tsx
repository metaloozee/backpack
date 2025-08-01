import type { UIMessage } from 'ai';
import { useCopyToClipboard } from 'usehooks-ts';
import equal from 'fast-deep-equal';

import { CopyIcon, TrashIcon, CheckIcon, ThumbsUpIcon, ThumbsDownIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { memo, useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { transitions } from '@/lib/animations';

export function PureMessageActions({
    chatId,
    message,
    isLoading,
}: {
    chatId: string;
    message: UIMessage;
    isLoading: boolean;
}) {
    const [_, copyToClipboard] = useCopyToClipboard();
    const [isCopied, setIsCopied] = useState(false);
    const [isThumbsUp, setIsThumbsUp] = useState(false);
    const [isThumbsDown, setIsThumbsDown] = useState(false);

    useEffect(() => {
        if (isCopied) {
            const timer = setTimeout(() => {
                setIsCopied(false);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isCopied]);

    useEffect(() => {
        if (isThumbsUp) {
            const timer = setTimeout(() => {
                setIsThumbsUp(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [isThumbsUp]);

    useEffect(() => {
        if (isThumbsDown) {
            const timer = setTimeout(() => {
                setIsThumbsDown(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [isThumbsDown]);

    if (isLoading) return null;
    if (message.role === 'user') return null;

    return (
        <TooltipProvider delayDuration={0}>
            <div className="w-full flex flex-row gap-1 flex-wrap ">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <motion.div initial="rest" whileHover="hover" whileTap="tap">
                            <Button
                                className="text-xs"
                                size={'icon'}
                                variant={'ghost'}
                                onClick={async () => {
                                    const textFromParts = message.parts
                                        ?.filter((part) => part.type == 'text')
                                        .map((part) => part.text)
                                        .join('\n')
                                        .trim();

                                    if (!textFromParts) {
                                        return toast.error('There is no text to copy.');
                                    }

                                    await copyToClipboard(textFromParts);
                                    setIsCopied(true);
                                }}
                            >
                                <AnimatePresence mode="wait" initial={false}>
                                    {isCopied ? (
                                        <motion.div
                                            key="check"
                                            initial={{ scale: 0, opacity: 0, rotate: -180 }}
                                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                            exit={{ scale: 0, opacity: 0, rotate: 180 }}
                                            transition={transitions.bouncy}
                                        >
                                            <CheckIcon className="size-3" />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="copy"
                                            initial={{ scale: 0, opacity: 0, rotate: -180 }}
                                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                            exit={{ scale: 0, opacity: 0, rotate: 180 }}
                                            transition={transitions.smooth}
                                        >
                                            <CopyIcon className="size-3" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Button>
                        </motion.div>
                    </TooltipTrigger>
                    <TooltipContent sideOffset={10}>
                        <p>{isCopied ? 'Copied!' : 'Copy message'}</p>
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <motion.div initial="rest" whileHover="hover" whileTap="tap">
                            <Button
                                className="text-xs"
                                size={'icon'}
                                variant={'ghost'}
                                onClick={() => {
                                    console.log('Thumbs up clicked for message:', message.id);
                                    setIsThumbsUp(true);
                                }}
                            >
                                <AnimatePresence mode="wait" initial={false}>
                                    {isThumbsUp ? (
                                        <motion.div
                                            key="thumbs-up-active"
                                            initial={{ scale: 0, opacity: 0, rotate: -180 }}
                                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                            exit={{ scale: 0, opacity: 0, rotate: 180 }}
                                            transition={transitions.bouncy}
                                        >
                                            <ThumbsUpIcon className="size-3 fill-current" />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="thumbs-up"
                                            initial={{ scale: 0, opacity: 0, rotate: -180 }}
                                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                            exit={{ scale: 0, opacity: 0, rotate: 180 }}
                                            transition={transitions.smooth}
                                        >
                                            <ThumbsUpIcon className="size-3" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Button>
                        </motion.div>
                    </TooltipTrigger>
                    <TooltipContent sideOffset={10}>
                        <p>{isThumbsUp ? 'Liked!' : 'Like message'}</p>
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <motion.div initial="rest" whileHover="hover" whileTap="tap">
                            <Button
                                className="text-xs"
                                size={'icon'}
                                variant={'ghost'}
                                onClick={() => {
                                    console.log('Thumbs down clicked for message:', message.id);
                                    setIsThumbsDown(true);
                                }}
                            >
                                <AnimatePresence mode="wait" initial={false}>
                                    {isThumbsDown ? (
                                        <motion.div
                                            key="thumbs-down-active"
                                            initial={{ scale: 0, opacity: 0, rotate: -180 }}
                                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                            exit={{ scale: 0, opacity: 0, rotate: 180 }}
                                            transition={transitions.bouncy}
                                        >
                                            <ThumbsDownIcon className="size-3 fill-current" />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="thumbs-down"
                                            initial={{ scale: 0, opacity: 0, rotate: -180 }}
                                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                            exit={{ scale: 0, opacity: 0, rotate: 180 }}
                                            transition={transitions.smooth}
                                        >
                                            <ThumbsDownIcon className="size-3" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Button>
                        </motion.div>
                    </TooltipTrigger>
                    <TooltipContent sideOffset={10}>
                        <p>{isThumbsDown ? 'Disliked!' : 'Dislike message'}</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    );
}

export const MessageActions = memo(PureMessageActions, (prevProps, nextProps) => {
    if (!equal(prevProps.isLoading, nextProps.isLoading)) return false;
    return true;
});
