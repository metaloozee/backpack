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
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1],
                layout: { duration: 0.3 },
            }}
            style={{
                willChange: 'transform',
                backfaceVisibility: 'hidden',
            }}
            className={cn(
                'relative w-full rounded-lg border border-border/50 bg-zinc-900/50 p-4 transition-colors duration-200 hover:bg-zinc-900/70',
                'flex justify-between items-center'
            )}
        >
            <Link className="w-full" key={chat.id} href={`/c/${chat.id}`}>
                <div className="flex flex-col gap-1 justify-start items-start w-full">
                    <p className="max-w-md truncate">{chat.chatName}</p>

                    <p className="text-xs text-muted-foreground truncate max-w-md">
                        {chat.messages[1].content}
                    </p>
                </div>
            </Link>

            {isChatPage && chat.spaceId && chat.spaceId.length > 0 && (
                <LibraryIcon className="mx-6 size-4 text-muted-foreground" />
            )}

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button variant={'destructive'} size={'icon'}>
                        <Trash2Icon className="size-2" />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader className="space-y-5">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="space-y-2"
                        >
                            <DialogTitle>Are you absolutely sure?</DialogTitle>
                            <DialogDescription className="text-sm">
                                This action cannot be undone. This will permanently delete your chat
                                and remove your data from our servers.
                            </DialogDescription>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="w-full flex flex-row-reverse gap-2"
                        >
                            <Button
                                variant={'destructive'}
                                disabled={mutation.isLoading}
                                className="text-xs"
                                onClick={handleDelete}
                            >
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="flex justify-center items-center gap-2 w-full"
                                >
                                    {mutation.isLoading ? (
                                        <Loader className="size-3 text-red-400 animate-spin" />
                                    ) : (
                                        <>delete</>
                                    )}
                                </motion.div>
                            </Button>
                            <Button
                                onClick={() => setIsOpen(!isOpen)}
                                variant={'secondary'}
                                className="text-xs"
                            >
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="flex justify-center items-center gap-2 w-full"
                                >
                                    cancel
                                </motion.div>
                            </Button>
                        </motion.div>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}
