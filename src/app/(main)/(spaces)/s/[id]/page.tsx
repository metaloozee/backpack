import { checkAuth, getUserAuth } from '@/lib/auth/utils';
import { db } from '@/lib/db';
import { chat, knowledge, spaces } from '@/lib/db/schema/app';
import { and, desc, eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { BookOpenIcon, LibraryIcon, SettingsIcon } from 'lucide-react';
import { Chat } from '@/components/Chat';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { KnowledgeDialog } from '@/components/spaces/KnowledgeDialog';
import { generateUUID } from '@/lib/ai/utils';

export default async function SpacePage({ params }: { params: Promise<{ id: string }> }) {
    await checkAuth();
    const { session } = await getUserAuth();

    const user = session!.user;
    const { id: spaceId } = await params;
    const chatId = generateUUID();

    const [spaceData] = await db
        .select()
        .from(spaces)
        .where(and(eq(spaces.id, spaceId), eq(spaces.userId, user.id)));

    if (!spaceData) {
        return notFound();
    }

    const knowledgeData = await db
        .select()
        .from(knowledge)
        .where(and(eq(knowledge.spaceId, spaceId), eq(knowledge.userId, user.id)));

    const chatData = await db
        .select()
        .from(chat)
        .where(and(eq(chat.spaceId, spaceId), eq(chat.userId, user.id)))
        .orderBy(desc(chat.createdAt));

    return (
        <div className="mx-20 flex flex-row justify-evenly gap-20">
            <div className="w-full">
                <Chat
                    spaceId={spaceData.id}
                    id={chatId}
                    initialMessages={[]}
                    session={session}
                    autoResume={false}
                    chatsData={chatData}
                />
            </div>
            <div className="mt-20 max-w-lg flex flex-col gap-10 w-full">
                <div className="w-full flex flex-col justify-end items-end gap-2">
                    <h1 className="w-full text-3xl text-right">{spaceData.spaceTitle}</h1>
                    <p className="w-full text-muted-foreground text-right text-xs">
                        {spaceData.spaceDescription}
                    </p>
                </div>
                <div className="space-y-4 w-full flex flex-col justify-start items-start">
                    <Dialog>
                        <DialogTrigger className="w-full px-6 py-4 rounded-md bg-zinc-900/50 border-2 text-left flex justify-start items-center gap-3">
                            <SettingsIcon className="size-5 text-muted-foreground" />
                            Settings
                        </DialogTrigger>
                        <DialogContent>
                            <DialogTitle>Settings</DialogTitle>
                            <p>coming soon...</p>
                        </DialogContent>
                    </Dialog>

                    <KnowledgeDialog spaceId={spaceData.id} knowledgeData={knowledgeData} />
                </div>
            </div>
        </div>
    );
}
