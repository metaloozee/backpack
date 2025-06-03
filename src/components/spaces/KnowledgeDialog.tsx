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
import { trpc } from '@/lib/trpc/client';

type KnowledgeDialogProps = {
    spaceId: string;
    knowledgeData: Knowledge[];
};

export function KnowledgeDialog({ spaceId, knowledgeData }: KnowledgeDialogProps) {
    const webpageKnowledge = knowledgeData.filter((k) => k.knowledgeType === 'webpage');
    const pdfKnowledge = knowledgeData.filter((k) => k.knowledgeType === 'pdf');
    const [activeTab, setActiveTab] = React.useState<'webpage' | 'pdf'>('webpage');
    const [url, setUrl] = React.useState('');

    const [isOpen, setIsOpen] = React.useState(false);

    const webPageMutation = trpc.space.saveWebPage.useMutation();

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
        if (activeTab === 'pdf') {
            return (
                <div className="w-full text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">PDF upload coming soon...</p>
                </div>
            );
        }

        return (
            <form
                onSubmit={handleSubmit}
                className="w-full h-full flex justify-center items-center gap-2"
            >
                <Input
                    className="flex-1 focus-visible:ring-1"
                    disabled={webPageMutation.isLoading}
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter webpage URL"
                    required
                />
                <Button type="submit" variant={'secondary'} disabled={webPageMutation.isLoading}>
                    {webPageMutation.isLoading ? (
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
            <DialogTrigger className="w-full px-6 py-4 rounded-md bg-neutral-900/50 border-2 text-left flex justify-start items-center gap-3">
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
