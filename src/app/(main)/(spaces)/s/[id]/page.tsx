import { checkAuth, getUserAuth } from '@/lib/auth/utils';
import { db } from '@/lib/db';
import { chat as chats, knowledge, spaces } from '@/lib/db/schema/app';
import { and, desc, eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { SettingsIcon } from 'lucide-react';
import { Chat } from '@/components/Chat';
import { generateId } from 'ai';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { KnowledgeDialog } from '@/components/spaces/KnowledgeDialog';
import { Session } from 'next-auth';

export type ChatData = {
    id: string;
    userId: string;
    createdAt: Date;
    spaceId: string | null;
    chatName: string;
    messages: unknown;
};

export default async function SpacePage({ params }: { params: Promise<{ id: string }> }) {
    await checkAuth();
    const { session } = await getUserAuth();

    const user = session!.user;
    const { id: spaceId } = await params;
    const chatId = generateId();

    const [spaceData] = await db
        .select()
        .from(spaces)
        .where(and(eq(spaces.id, spaceId), eq(spaces.userId, user.id)));

    if (!spaceData) {
        return notFound();
    }

    const chatsData = await db
        .select()
        .from(chats)
        .where(and(eq(chats.spaceId, spaceId), eq(chats.userId, user.id)))
        .orderBy(desc(chats.createdAt))
        .limit(3);

    const knowledgeData = await db
        .select()
        .from(knowledge)
        .where(and(eq(knowledge.spaceId, spaceId), eq(knowledge.userId, user.id)));

    return (
        <div className="mx-20 flex flex-row justify-evenly gap-20">
            <div className="max-w-2xl w-full">
                <Chat
                    spaceId={spaceData.id}
                    id={chatId}
                    initialMessages={[]}
                    session={session as Session}
                    autoResume={false}
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
