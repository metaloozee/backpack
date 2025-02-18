'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { Dialog, DialogHeader, DialogTrigger, DialogContent, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { PlusIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';

const formSchema = z.object({
    contentType: z.enum(['webpage', 'pdf']),
    url: z.string().url().optional(),
});

export function UploadKnowledgeBtn({ spaceId }: { spaceId: string }) {
    const [selectedOpen, setSelectedOpen] = React.useState<'webpage' | 'pdf' | undefined>(
        undefined
    );

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            contentType: undefined,
        },
    });

    const handleWebPageSubmit = (values: z.infer<typeof formSchema>) => {
        console.log('YOOOOOO');
    };

    const handlePdfSubmit = (values: z.infer<typeof formSchema>) => {
        console.log('Nuh Uh');
    };

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        if (values.contentType === 'webpage') {
            handleWebPageSubmit(values);
        } else if (values.contentType === 'pdf') {
            handlePdfSubmit(values);
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant={'secondary'} size={'sm'}>
                    <motion.div
                        className="flex gap-2 justify-center items-center"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, type: 'spring', stiffness: 400, damping: 10 }}
                    >
                        <PlusIcon />
                        Upload
                    </motion.div>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="mb-2">Upload Document</DialogTitle>
                    <Separator />
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="flex flex-col justify-start items-start w-full gap-5"
                    >
                        <FormField
                            control={form.control}
                            name="contentType"
                            render={({ field }) => (
                                <FormItem className="max-w-xs w-full">
                                    <FormLabel>Select Type</FormLabel>
                                    <Select
                                        onValueChange={(value: 'webpage' | 'pdf') => {
                                            field.onChange(value);
                                            setSelectedOpen(value);
                                        }}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Knowledge Type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="webpage">Web Page</SelectItem>
                                            <SelectItem value="pdf">PDF</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {selectedOpen === 'webpage' && (
                            <FormField
                                control={form.control}
                                name="url"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>Web Page URL</FormLabel>
                                        <FormControl>
                                            <Input placeholder="" type="url" {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        )}

                        {selectedOpen === 'pdf' && <p className="text-xs">Coming Soon</p>}

                        {!!selectedOpen && (
                            <Button
                                disabled={selectedOpen === 'pdf'}
                                type="submit"
                                className="w-full"
                            >
                                Upload
                            </Button>
                        )}
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
