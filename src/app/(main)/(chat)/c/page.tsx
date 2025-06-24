import ChatDisplayCard from '@/components/chat/DisplayCard';
import { Header } from '@/components/chat/Header';
import { db } from '@/lib/db';
import { Chat, chat as chatsSchema } from '@/lib/db/schema/app';
import { desc, eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export type ChatData = {
    id: string;
    userId: string;
    createdAt: Date;
    spaceId: string | null;
    chatName: string;
    messages: unknown;
};

export default async function Spaces() {
    const session = await auth();
    if (!session?.user) {
        return redirect('/sign-in');
    }

    const user = session.user;

    const chats = await db
        .select()
        .from(chatsSchema)
        .where(eq(chatsSchema.userId, user.id))
        .limit(10)
        .orderBy(desc(chatsSchema.createdAt));

    return (
        <div className="m-20 flex flex-col justify-center items-start gap-5">
            <Header />
            <div className="mt-5 max-w-5xl w-full flex flex-row flex-wrap justify-start items-start gap-3">
                {chats.map((chat) => {
                    return <ChatDisplayCard key={chat.id} chat={chat} />;
                })}
            </div>
        </div>
    );
}
