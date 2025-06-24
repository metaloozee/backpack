import { Header } from '@/components/chat/Header';

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import DisplayChats from '@/components/chat/display-chats';

export default async function Spaces() {
    const session = await auth();
    if (!session?.user) {
        return redirect('/sign-in');
    }

    return (
        <div className="m-20 flex flex-col justify-center items-start gap-5">
            <Header />
            <div className="mt-5 max-w-5xl w-full flex flex-row flex-wrap justify-start items-start gap-3">
                <DisplayChats />
            </div>
        </div>
    );
}
