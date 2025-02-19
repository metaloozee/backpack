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
            variants={{
                hidden: { y: 20, opacity: 0 },
                visible: {
                    y: 0,
                    opacity: 1,
                },
            }}
            transition={{ type: 'spring', damping: 10, stiffness: 200 }}
            key={chat.id}
            className="border-b pb-4 rounded-md w-full flex justify-between items-center"
        >
            <Link className="w-full" key={chat.id} href={`/c/${chat.id}`}>
                <div className=" flex flex-col gap-1 justify-start items-start">
                    <p className="max-w-md truncate">{chat.chatName}</p>
                    {isChatPage ? (
                        <div className="flex flex-row gap-5 items-center w-full">
                            <p className="text-xs text-muted-foreground truncate max-w-md">
                                {chat.messages[1].content}
                            </p>
                            {chat.spaceId && chat.spaceId.length > 0 && (
                                <LibraryIcon className="size-4 text-muted-foreground" />
                            )}
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground truncate max-w-md">
                            {chat.messages[1].content}
                        </p>
                    )}
                </div>
            </Link>

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
