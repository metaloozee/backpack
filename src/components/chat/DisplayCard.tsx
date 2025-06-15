'use client';

import * as React from 'react';
import { Chat } from '@/lib/db/schema/app';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { LibraryIcon, Loader, Trash2Icon } from 'lucide-react';
import Link from 'next/link';
import {
    Dialog,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogContent,
    DialogTrigger,
} from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    messageVariants,
    buttonVariants,
    fadeVariants,
    iconVariants,
    modalVariants,
    backdropVariants,
    staggerVariants,
    transitions,
} from '@/lib/animations';
import { format } from 'timeago.js';

export default function ChatDisplayCard({ chat }: { chat: Chat }) {
    const pathName = usePathname();
    const isChatPage = pathName === `/c`;

    const [isOpen, setIsOpen] = React.useState(false);

    const router = useRouter();

    const mutation = trpc.chat.deleteChat.useMutation();
    const handleDelete = async (e: any) => {
        e.preventDefault();

        try {
            mutation.mutate({
                chatId: chat.id,
            });

            setIsOpen(false);

            if (isChatPage) {
                router.refresh();
            } else if (chat.spaceId && chat.spaceId.length > 0) {
                router.push(`/s/${chat.spaceId}`);
            } else {
                router.push(`/`);
            }

            return toast.success('Successfully deleted the chat.');
        } catch (e) {
            toast.error('Uh oh!', { description: (e as Error).message });
        }
    };

    return (
        <motion.div
            variants={messageVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
            transition={transitions.smooth}
            className={cn(
                'relative w-full rounded-lg border border-border/50 bg-neutral-900/50 p-4 transition-colors duration-200 hover:bg-neutral-900/70',
                'flex justify-between items-center'
            )}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
        >
            <Link className="w-full" key={chat.id} href={`/c/${chat.id}`}>
                <motion.div
                    variants={fadeVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-col gap-1 justify-start items-start w-full"
                >
                    <p className="max-w-md truncate">{chat.title}</p>

                    <p className="text-xs text-muted-foreground truncate max-w-md">
                        Created {format(chat.createdAt)}
                    </p>
                </motion.div>
            </Link>

            {isChatPage && chat.spaceId && chat.spaceId.length > 0 && (
                <motion.div variants={iconVariants} initial="rest" whileHover="hover">
                    <LibraryIcon className="mx-6 size-4 text-muted-foreground" />
                </motion.div>
            )}

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <motion.div
                        variants={buttonVariants}
                        initial="rest"
                        whileHover="hover"
                        whileTap="tap"
                    >
                        <Button variant={'destructive'} size={'icon'}>
                            <Trash2Icon className="size-3" />
                        </Button>
                    </motion.div>
                </DialogTrigger>
                <DialogContent>
                    <motion.div
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <DialogHeader className="space-y-5">
                            <motion.div
                                variants={staggerVariants.container}
                                initial="hidden"
                                animate="visible"
                                className="space-y-2"
                            >
                                <motion.div variants={staggerVariants.item}>
                                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                                </motion.div>
                                <motion.div variants={staggerVariants.item}>
                                    <DialogDescription className="text-sm">
                                        This action cannot be undone. This will permanently delete
                                        your chat and remove your data from our servers.
                                    </DialogDescription>
                                </motion.div>
                            </motion.div>

                            <motion.div
                                variants={staggerVariants.container}
                                initial="hidden"
                                animate="visible"
                                className="w-full flex flex-row-reverse gap-2"
                            >
                                <motion.div variants={staggerVariants.item}>
                                    <motion.div
                                        variants={buttonVariants}
                                        initial="rest"
                                        whileHover="hover"
                                        whileTap="tap"
                                    >
                                        <Button
                                            variant={'destructive'}
                                            disabled={mutation.isLoading}
                                            className="text-xs"
                                            onClick={handleDelete}
                                        >
                                            <motion.div
                                                variants={fadeVariants}
                                                initial="hidden"
                                                animate="visible"
                                                className="flex justify-center items-center gap-2 w-full"
                                            >
                                                {mutation.isLoading ? (
                                                    <motion.div
                                                        variants={iconVariants}
                                                        initial="rest"
                                                        animate="spin"
                                                    >
                                                        <Loader className="size-3 text-red-400" />
                                                    </motion.div>
                                                ) : (
                                                    <>delete</>
                                                )}
                                            </motion.div>
                                        </Button>
                                    </motion.div>
                                </motion.div>
                                <motion.div variants={staggerVariants.item}>
                                    <motion.div
                                        variants={buttonVariants}
                                        initial="rest"
                                        whileHover="hover"
                                        whileTap="tap"
                                    >
                                        <Button
                                            onClick={() => setIsOpen(!isOpen)}
                                            variant={'secondary'}
                                            className="text-xs"
                                        >
                                            <motion.div
                                                variants={fadeVariants}
                                                initial="hidden"
                                                animate="visible"
                                                className="flex justify-center items-center gap-2 w-full"
                                            >
                                                cancel
                                            </motion.div>
                                        </Button>
                                    </motion.div>
                                </motion.div>
                            </motion.div>
                        </DialogHeader>
                    </motion.div>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}
