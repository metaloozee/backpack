import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeftIcon, PencilLineIcon } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { format } from 'timeago.js';
import { DisplayMemories } from '@/components/display-memories';
import { getUser } from '@/lib/auth/utils';

export default async function AccountPage() {
    const user = await getUser();
    if (!user) {
        return redirect('/sign-in');
    }

    return (
        <div className="mx-auto my-20 max-w-3xl md:px-20 w-full flex flex-col justify-center items-start gap-10">
            <Button size={'sm'} variant={'outline'} asChild>
                <Link href="/" className="text-xs">
                    <ArrowLeftIcon className="size-3" /> Back to Home
                </Link>
            </Button>
            <div className="w-full flex flex-col justify-center items-start gap-4">
                <div className="w-full flex flex-row justify-between items-end bg-neutral-900 border p-3 rounded-lg">
                    <div className="flex flex-row justify-start items-center gap-3">
                        <Avatar className="size-18 rounded-md">
                            <AvatarImage src={user.image ?? ''} />
                        </Avatar>
                        <div className="flex flex-col justify-center items-start">
                            <p className="text-lg font-medium flex flex-row justify-start items-center gap-1">
                                {user.name}
                            </p>
                            <p className="text-xs">{user.email}</p>
                            <p className="text-xs text-muted-foreground">
                                joined {format(user.createdAt)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="w-full flex flex-col justify-center items-center gap-4">
                <div className="w-full flex flex-row justify-between items-center">
                    <h2 className="text-lg">Memories</h2>
                </div>
                <Separator />
                <DisplayMemories />
            </div>

            <div className="bg-red-950/50 border border-red-900 rounded-lg w-full flex flex-row justify-between items-center">
                <div className="flex flex-col gap-2 p-4 w-full">
                    <h3 className="text-base font-semibold text-red-200">Danger Zone</h3>
                    <p className="text-xs text-red-300">
                        Deleting your account will permanently remove all your data, memories, and
                        files. <br />
                        <span className="font-semibold">This action cannot be undone.</span>
                    </p>
                    <Button variant="destructive" disabled size="sm" className="mt-2 w-fit">
                        Delete My Account
                    </Button>
                </div>
            </div>
        </div>
    );
}
