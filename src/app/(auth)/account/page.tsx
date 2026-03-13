import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "timeago.js";
import { DisplayMemories } from "@/components/display-memories";
import { McpServerConfig } from "@/components/mcp-server-config";
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
				<div className="flex w-full flex-row items-end justify-between rounded-lg border bg-card p-3 dark:bg-neutral-900">
					<div className="flex flex-row items-center justify-start gap-3">
						<Avatar className="size-18 rounded-md">
							<AvatarImage src={user.image ?? ""} />
						</Avatar>
						<div className="flex flex-col items-start justify-center">
							<p className="flex flex-row items-center justify-start gap-1 font-medium text-lg">
								{user.name}
							</p>
							<p className="text-xs">{user.email}</p>
							<p className="text-muted-foreground text-xs">
								joined {format(user.createdAt)}
							</p>
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

			<div className="flex w-full flex-col items-center justify-center gap-4">
				<McpServerConfig />
			</div>

			<div className="w-full overflow-hidden rounded-3xl border border-red-500/30 bg-red-50 shadow-sm dark:border-red-500/25 dark:bg-red-950/20">
				<div className="flex flex-col gap-5 p-5 sm:p-6">
					<div className="space-y-2">
						<h3 className="font-semibold text-base text-red-900 dark:text-red-100">
							Delete Account
						</h3>
						<p className="max-w-xl text-red-950/90 text-sm leading-6 dark:text-red-100/85">
							Deleting your account removes your memories, files,
							and access permanently. This action cannot be
							undone.
						</p>
					</div>

					<div className="flex flex-col gap-3 rounded-2xl border border-red-500/20 bg-background p-4 dark:border-red-500/20 dark:bg-neutral-950/70">
						<p className="text-muted-foreground text-xs leading-5 dark:text-neutral-400">
							Account deletion is currently disabled while we
							finish the self-serve recovery and export flow.
						</p>
						<Button
							className="w-fit border-red-500/25 bg-red-500/10 text-red-700 shadow-none hover:bg-red-500/15 hover:text-red-800 disabled:border-red-500/15 disabled:bg-red-500/8 disabled:text-red-700/60 dark:border-red-500/25 dark:bg-red-500/15 dark:text-red-200 dark:disabled:text-red-200/45 dark:hover:bg-red-500/20 dark:hover:text-red-100"
							disabled
							size="sm"
							variant="outline"
						>
							Delete My Account
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
