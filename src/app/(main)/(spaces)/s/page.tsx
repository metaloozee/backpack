import { Cards } from "@/components/spaces/cards";
import { Header } from "@/components/spaces/header";
import { requireApprovedAuthSession } from "@/lib/auth/utils";
import { caller } from "@/lib/trpc/server";

export default async function SpacesPage() {
	const { user } = await requireApprovedAuthSession();

	const { spaces } = await caller.space.getSpaces({});

	return (
		<div className="flex h-full flex-col items-start justify-start gap-5 overflow-y-auto px-4 py-6 sm:px-8 sm:py-10 md:p-20">
			<Header userId={user.id} />
			<Cards spaces={spaces} />
		</div>
	);
}
