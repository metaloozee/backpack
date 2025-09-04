import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "timeago.js";
import { DisplayMemories } from "@/components/display-memories";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getUser } from "@/lib/auth/utils";

export default async function AccountPage() {
	const user = await getUser();
	if (!user) {
		return redirect("/sign-in");
	}

	return (
		<div className="mx-auto my-20 flex w-full max-w-3xl flex-col items-start justify-center gap-10 md:px-20">
			<Button asChild size={"sm"} variant={"outline"}>
				<Link className="text-xs" href="/">
					<ArrowLeftIcon className="size-3" /> Back to Home
				</Link>
			</Button>
			<div className="flex w-full flex-col items-start justify-center gap-4">
				<div className="flex w-full flex-row items-end justify-between rounded-lg border bg-neutral-900 p-3">
					<div className="flex flex-row items-center justify-start gap-3">
						<Avatar className="size-18 rounded-md">
							<AvatarImage src={user.image ?? ""} />
						</Avatar>
						<div className="flex flex-col items-start justify-center">
							<p className="flex flex-row items-center justify-start gap-1 font-medium text-lg">
								{user.name}
							</p>
							<p className="text-xs">{user.email}</p>
							<p className="text-muted-foreground text-xs">joined {format(user.createdAt)}</p>
						</div>
					</div>
				</div>
			</div>
			<div className="flex w-full flex-col items-center justify-center gap-4">
				<div className="flex w-full flex-row items-center justify-between">
					<h2 className="text-lg">Memories</h2>
				</div>
				<Separator />
				<DisplayMemories />
			</div>

			<div className="flex w-full flex-row items-center justify-between rounded-lg border border-red-900 bg-red-950/50">
				<div className="flex w-full flex-col gap-2 p-4">
					<h3 className="font-semibold text-base text-red-200">Danger Zone</h3>
					<p className="text-red-300 text-xs">
						Deleting your account will permanently remove all your data, memories, and files. <br />
						<span className="font-semibold">This action cannot be undone.</span>
					</p>
					<Button className="mt-2 w-fit" disabled size="sm" variant="destructive">
						Delete My Account
					</Button>
				</div>
			</div>
		</div>
	);
}
