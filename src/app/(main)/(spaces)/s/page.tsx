import { Cards } from "@/components/spaces/cards";
import { Header } from "@/components/spaces/header";
import { getUser } from "@/lib/auth/utils";
import { caller } from "@/lib/trpc/server";

export default async function SpacesPage() {
	const user = await getUser();

	const { spaces } = await caller.space.getSpaces({});

	return (
		<div className="m-20 flex flex-col items-start justify-center gap-5">
			<Header userId={user?.id ?? ""} />
			<Cards spaces={spaces} />
		</div>
	);
}
