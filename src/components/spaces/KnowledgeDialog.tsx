'use client';

import * as React from 'react';
import { BookCopyIcon, Loader2, PlusIcon } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KnowledgeTable } from './KnowledgeTable';
import { Knowledge } from '@/lib/db/schema/app';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useTRPC } from '@/lib/trpc/trpc';

type KnowledgeDialogProps = {
    spaceId: string;
    knowledgeData: Knowledge[];
};

export function KnowledgeDialog({ spaceId, knowledgeData }: KnowledgeDialogProps) {
    const trpc = useTRPC();

    const webpageKnowledge = knowledgeData.filter((k) => k.knowledgeType === 'webpage');
    const pdfKnowledge = knowledgeData.filter((k) => k.knowledgeType === 'pdf');
    const [activeTab, setActiveTab] = React.useState<'webpage' | 'pdf'>('webpage');

    const [url, setUrl] = React.useState('');
    const webPageMutation = useMutation(trpc.space.saveWebPage.mutationOptions());

    const [pdfFiles, setPdfFiles] = React.useState<File[]>([]);
    const [isUploadingPdf, setIsUploadingPdf] = React.useState(false);
    const pdfMutation = useMutation(trpc.space.savePdf.mutationOptions());

    const [isOpen, setIsOpen] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!url) {
            return toast.error('URL is required');
        }

        try {
            await webPageMutation.mutateAsync({
                spaceId,
                url,
            });

            setIsOpen(false);
            setUrl('');
            return toast.success('Successfully added into the knowledge.');
        } catch (e) {
            toast.error('uh Oh!', { description: (e as Error).message });
        }
    };

    const renderUploadForm = () => {
        // PDF Upload Form
        if (activeTab === 'pdf') {
            const handlePdfSubmit = async (e: React.FormEvent) => {
                e.preventDefault();

                if (pdfFiles.length === 0) {
                    return toast.error('Please select at least one PDF');
                }

                setIsUploadingPdf(true);

                /*
                 * Here, I am sequentially uploading each PDF file for its processing.
                 * TODO: Move heavy PDF processing to a real background job queue using Upstash QStash.
                 */

                for (const file of pdfFiles) {
                    const formData = new FormData();
                    formData.append('spaceId', spaceId);
                    formData.append('file', file);

                    try {
                        await pdfMutation.mutateAsync(formData);
                        toast.success(`${file.name} processed`);
                    } catch (e) {
                        toast.error(`Failed to process ${file.name}`, {
                            description: (e as Error).message,
                        });
                    }
                }

                setIsUploadingPdf(false);
                setPdfFiles([]);
                setIsOpen(false);
            };

            return (
                <form
                    onSubmit={handlePdfSubmit}
                    className="w-full h-full flex justify-center items-center gap-2"
                >
                    <Input
                        type="file"
                        accept="application/pdf"
                        multiple
                        className="flex-1 focus-visible:ring-1"
                        disabled={isUploadingPdf}
                        onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                                setPdfFiles(Array.from(e.target.files));
                            }
                        }}
                        required
                    />
                    <Button type="submit" variant={'secondary'} disabled={isUploadingPdf}>
                        {isUploadingPdf ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <>
                                <PlusIcon className="size-4" />
                                Upload
                            </>
                        )}
                    </Button>
                </form>
            );
        }

        // WebPage Upload Form
        return (
            <form
                onSubmit={handleSubmit}
                className="w-full h-full flex justify-center items-center gap-2"
            >
                <Input
                    className="flex-1 focus-visible:ring-1"
                    disabled={webPageMutation.isPending}
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter webpage URL"
                    required
                />
                <Button type="submit" variant={'secondary'} disabled={webPageMutation.isPending}>
                    {webPageMutation.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        <>
                            <PlusIcon className="size-4" />
                            Upload
                        </>
                    )}
                </Button>
            </form>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger className="w-full px-6 py-4 rounded-md !bg-neutral-900/50 border-2 text-left flex justify-start items-center gap-3">
                <BookCopyIcon className="size-5 text-muted-foreground" />
                <div className="w-full gap-2 flex justify-start items-center ">
                    <p>Knowledge Base</p>
                    <p className="text-[10px] text-muted-foreground">Uploaded Documents</p>
                </div>
            </DialogTrigger>
            <DialogContent className="min-w-2xl bg-neutral-950">
                <DialogHeader>
                    <DialogTitle>Knowledge Base</DialogTitle>
                </DialogHeader>
                <Tabs
                    defaultValue="webpage"
                    className="w-full"
                    onValueChange={(value) => setActiveTab(value as 'webpage' | 'pdf')}
                >
                    <TabsList className="grid w-full grid-cols-2 bg-black">
                        <TabsTrigger value="webpage">Web Pages</TabsTrigger>
                        <TabsTrigger value="pdf">PDF Documents</TabsTrigger>
                    </TabsList>
                    <TabsContent value="webpage" className="space-y-6">
                        <KnowledgeTable knowledgeData={webpageKnowledge} />
                        <DialogFooter className="w-full">{renderUploadForm()}</DialogFooter>
                    </TabsContent>
                    <TabsContent value="pdf" className="space-y-6">
                        <KnowledgeTable knowledgeData={pdfKnowledge} />
                        <DialogFooter className="w-full">{renderUploadForm()}</DialogFooter>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
