import { Loader } from '@/components/ui/loader';

export default function Loading() {
    return (
        <div className="h-screen flex justify-center items-center">
            <Loader size="md" />
        </div>
    );
}
