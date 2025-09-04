import { eq } from "drizzle-orm";
import { Cards } from "@/components/spaces/cards";
import { Header } from "@/components/spaces/header";
import { getUser } from "@/lib/auth/utils";
import { db } from "@/lib/db";
import { spaces as spacesSchema } from "@/lib/db/schema/app";

export default async function SpacesPage() {
	const user = await getUser();

	const spaces = await db
		.select()
		.from(spacesSchema)
		.where(eq(spacesSchema.userId, user?.id ?? ""));

	return (
		<div className="m-20 flex flex-col items-start justify-center gap-5">
			<Header userId={user?.id ?? ""} />
			<Cards spaces={spaces} />
		</div>
	);
}
