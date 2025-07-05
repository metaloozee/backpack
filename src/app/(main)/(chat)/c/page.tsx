import { Header } from '@/components/chat/Header';

import DisplayChats from '@/components/chat/display-chats';

export default async function Spaces() {
    return (
        <div className="m-20 flex flex-col justify-center items-start gap-5">
            <Header />
            <div className="mt-5 max-w-5xl w-full flex flex-row flex-wrap justify-start items-start gap-3">
                <DisplayChats />
            </div>
        </div>
    );
}
