import { LoaderIcon } from 'lucide-react';

export default function Loading() {
    return (
        <div className="h-screen flex justify-center items-center">
            <div className="animate-spin">
                <LoaderIcon className="size-5 text-muted-foreground" />
            </div>
        </div>
    );
}
