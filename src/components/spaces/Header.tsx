'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from '../ui/button';
import { Loader, SquarePlusIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader } from '@/components/ui/dialog';
import { DialogTitle, DialogTrigger } from '@radix-ui/react-dialog';
import { useRouter } from 'next/navigation';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';

import { useTRPC } from '@/lib/trpc/trpc';
import { useMutation } from '@tanstack/react-query';

export const Header: React.FC<{ userId: string }> = ({ userId }) => {
    const trpc = useTRPC();
    const router = useRouter();

    const [isOpen, setIsOpen] = React.useState(false);
    const [spaceTitle, setSpaceTitle] = React.useState('');
    const [spaceDescription, setSpaceDescription] = React.useState('');
    const [customIns, setCustomIns] = React.useState('');

    const mutation = useMutation(trpc.space.createSpace.mutationOptions());

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!spaceTitle) {
            return toast.error('Space name is required');
        }

        try {
            const res = await mutation.mutateAsync({
                userId: userId,
                spaceTitle,
                spaceDescription,
                spaceCustomInstructions: customIns,
            });
            setIsOpen(false);
            router.push(`/s/${res.id}`);
            return toast.success('Successfully Created a New Space.');
        } catch (e) {
            toast.error('Uh oh!', { description: (e as Error).message });
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 10 }}
            className="flex flex-row justify-start items-center gap-5"
        >
            <h1 className="text-3xl">My Spaces</h1>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button variant={'secondary'} size={'sm'} className="text-xs">
                        <SquarePlusIcon /> New Space
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-xl">Create a New Space</DialogTitle>
                    </DialogHeader>
                    <Separator />
                    <AnimatePresence>
                        <motion.form
                            onSubmit={handleSubmit}
                            className="space-y-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="space-y-1"
                            >
                                <Label className="text-muted-foreground text-xs">Title</Label>
                                <Input
                                    disabled={mutation.isPending}
                                    id="spaceName"
                                    value={spaceTitle}
                                    onChange={(e: any) => setSpaceTitle(e.target.value)}
                                    placeholder="Enter space name"
                                    required
                                />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="space-y-1"
                            >
                                <Label className="text-muted-foreground text-xs">
                                    Description (optional)
                                </Label>
                                <Textarea
                                    disabled={mutation.isPending}
                                    id="spaceDescription"
                                    value={spaceDescription}
                                    onChange={(e: any) => setSpaceDescription(e.target.value)}
                                    placeholder="Political and Economical state of the World..."
                                />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="space-y-1"
                            >
                                <Label className="text-muted-foreground text-xs">
                                    Custom Instructions (optional)
                                </Label>
                                <Textarea
                                    disabled={mutation.isPending}
                                    id="customIns"
                                    value={customIns}
                                    onChange={(e: any) => setCustomIns(e.target.value)}
                                    placeholder="Explain like you're tutoring an eight year old..."
                                />
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="w-full flex justify-end"
                            >
                                <Button
                                    disabled={mutation.isPending}
                                    type="submit"
                                    className="text-xs"
                                >
                                    {mutation.isPending ? (
                                        <Loader className="size-4 animate-spin" />
                                    ) : (
                                        'Create Space'
                                    )}
                                </Button>
                            </motion.div>
                        </motion.form>
                    </AnimatePresence>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
};
