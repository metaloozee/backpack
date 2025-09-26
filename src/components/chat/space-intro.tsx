import { KnowledgeDialog } from "@/components/spaces/knowledge-dialog";
import { SettingsDialog } from "@/components/spaces/settings-dialog";
import type { Knowledge } from "@/lib/db/schema/app";

type SpaceIntroProps = {
	spaceId: string;
	spaceTitle: string;
	spaceDescription?: string;
	spaceStatus: "pending" | "error" | "success";
	knowledgeStatus: "pending" | "error" | "success";
	knowledgeData?: Knowledge[];
};

export function SpaceIntro({
	spaceId,
	spaceTitle,
	spaceDescription,
	spaceStatus,
	knowledgeStatus,
	knowledgeData = [],
}: SpaceIntroProps) {
	return (
		<div className="mt-40 mb-10 flex w-full max-w-3xl shrink-0 flex-row items-end justify-between gap-2">
			<div className="flex flex-col items-start justify-start gap-2">
				{spaceStatus === "pending" ? (
					<>
						<div className="h-7 w-48 animate-pulse rounded bg-neutral-900" />
						<div className="h-4 w-80 animate-pulse rounded bg-neutral-900" />
						<div className="h-4 w-56 animate-pulse rounded bg-neutral-900" />
					</>
				) : (
					<>
						<h1 className="text-left font-bold text-2xl">{spaceTitle}</h1>
						{spaceDescription ? (
							<p className="text-left text-muted-foreground text-xs">{spaceDescription}</p>
						) : null}
					</>
				)}
			</div>
			<div className="flex flex-row items-end justify-center gap-2">
				<SettingsDialog spaceDescription={spaceDescription} spaceId={spaceId} spaceName={spaceTitle} />
				{knowledgeStatus === "pending" ? (
					<div className="h-8 w-24 animate-pulse rounded-md bg-neutral-900" />
				) : (
					<KnowledgeDialog knowledgeData={knowledgeData ?? []} spaceId={spaceId} />
				)}
			</div>
		</div>
	);
}
