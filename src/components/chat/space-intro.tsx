import { KnowledgeDialog } from "@/components/spaces/knowledge-dialog";
import { SettingsDialog } from "@/components/spaces/settings-dialog";
import type { Knowledge } from "@/lib/db/schema/app";

interface SpaceIntroProps {
	spaceId: string;
	spaceTitle: string;
	spaceDescription?: string;
	spaceCustomInstructions?: string;
	spaceStatus: "pending" | "error" | "success";
	knowledgeStatus: "pending" | "error" | "success";
	knowledgeData?: Knowledge[];
}

export function SpaceIntro({
	spaceId,
	spaceTitle,
	spaceDescription,
	spaceCustomInstructions,
	spaceStatus,
	knowledgeStatus,
	knowledgeData = [],
}: SpaceIntroProps) {
	return (
		<div className="mb-6 flex w-full max-w-3xl shrink-0 flex-col gap-4 px-4 sm:mb-4 sm:flex-row sm:items-end sm:justify-between sm:gap-2 sm:px-0">
			<div className="flex flex-col items-start justify-start gap-2">
				{spaceStatus === "pending" ? (
					<>
						<div className="h-7 w-48 animate-pulse rounded bg-muted dark:bg-neutral-900" />
						<div className="h-4 w-80 animate-pulse rounded bg-muted dark:bg-neutral-900" />
						<div className="h-4 w-56 animate-pulse rounded bg-muted dark:bg-neutral-900" />
					</>
				) : (
					<>
						<h1 className="text-left font-bold text-2xl">
							{spaceTitle}
						</h1>
						{spaceDescription ? (
							<p className="text-left text-muted-foreground text-xs">
								{spaceDescription}
							</p>
						) : null}
					</>
				)}
			</div>
			<div className="flex flex-row items-end justify-start gap-2">
				<SettingsDialog
					spaceCustomInstructions={spaceCustomInstructions}
					spaceDescription={spaceDescription}
					spaceId={spaceId}
					spaceName={spaceTitle}
				/>
				{knowledgeStatus === "pending" ? (
					<div className="h-8 w-24 animate-pulse rounded-md bg-muted dark:bg-neutral-900" />
				) : (
					<KnowledgeDialog
						knowledgeData={knowledgeData ?? []}
						spaceId={spaceId}
					/>
				)}
			</div>
		</div>
	);
}
