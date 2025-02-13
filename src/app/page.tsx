import { Chat } from '@/components/Chat';
import { checkAuth } from '@/lib/auth/utils';
import { generateId } from 'ai';

export default async function IndexPage() {
    await checkAuth();
    const id = generateId();

    return <Chat id={id} />;
}
