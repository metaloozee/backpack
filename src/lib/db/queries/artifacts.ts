import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	type Artifact,
	type ArtifactVersion,
	artifact,
	artifactVersion,
} from "@/lib/db/schema/app";
import { BackpackError } from "@/lib/errors";

export type ArtifactKind = "text";
export type ArtifactVersionSource = "assistant" | "user" | "restore";

export interface ArtifactWithLatestVersion extends Artifact {
	latestVersion: ArtifactVersion | null;
}

export async function createArtifact({
	userId,
	chatId,
	title,
	kind = "text",
}: {
	userId: string;
	chatId: string;
	title: string;
	kind?: ArtifactKind;
}): Promise<Artifact> {
	try {
		const [createdArtifact] = await db
			.insert(artifact)
			.values({
				userId,
				chatId,
				title,
				kind,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		if (!createdArtifact) {
			throw new Error("Artifact insert returned no rows");
		}

		return createdArtifact;
	} catch (error) {
		throw BackpackError.database("Failed to create artifact", error);
	}
}

export async function createArtifactWithVersion({
	userId,
	chatId,
	title,
	kind = "text",
	content,
	source,
	messageId,
}: {
	userId: string;
	chatId: string;
	title: string;
	kind?: ArtifactKind;
	content: string;
	source: ArtifactVersionSource;
	messageId?: string;
}): Promise<{ artifact: Artifact; version: ArtifactVersion }> {
	try {
		return await db.transaction(async (tx) => {
			const [createdArtifact] = await tx
				.insert(artifact)
				.values({
					userId,
					chatId,
					title,
					kind,
					createdAt: new Date(),
					updatedAt: new Date(),
				})
				.returning();

			if (!createdArtifact) {
				throw new Error("Artifact insert returned no rows");
			}

			const [createdVersion] = await tx
				.insert(artifactVersion)
				.values({
					artifactId: createdArtifact.id,
					versionNumber: 1,
					content,
					source,
					messageId,
					createdAt: new Date(),
				})
				.returning();

			if (!createdVersion) {
				throw new Error("Artifact version insert returned no rows");
			}

			return { artifact: createdArtifact, version: createdVersion };
		});
	} catch (error) {
		throw BackpackError.database(
			"Failed to create artifact with version",
			error
		);
	}
}

export async function getArtifactsByChatIdAndUserId({
	chatId,
	userId,
}: {
	chatId: string;
	userId: string;
}): Promise<ArtifactWithLatestVersion[]> {
	try {
		const artifacts = await db
			.select()
			.from(artifact)
			.where(
				and(eq(artifact.chatId, chatId), eq(artifact.userId, userId))
			)
			.orderBy(desc(artifact.updatedAt));

		const items: ArtifactWithLatestVersion[] = [];
		for (const item of artifacts) {
			const latestVersion = await getLatestArtifactVersion({
				artifactId: item.id,
				userId,
			});
			items.push({ ...item, latestVersion });
		}

		return items;
	} catch (error) {
		throw BackpackError.database("Failed to get artifacts", error);
	}
}

export async function getArtifactWithVersionsByIdAndUserId({
	artifactId,
	userId,
}: {
	artifactId: string;
	userId: string;
}): Promise<{ artifact: Artifact; versions: ArtifactVersion[] } | null> {
	try {
		const [selectedArtifact] = await db
			.select()
			.from(artifact)
			.where(
				and(eq(artifact.id, artifactId), eq(artifact.userId, userId))
			)
			.limit(1);

		if (!selectedArtifact) {
			return null;
		}

		const versions = await db
			.select()
			.from(artifactVersion)
			.where(eq(artifactVersion.artifactId, artifactId))
			.orderBy(desc(artifactVersion.versionNumber));

		return { artifact: selectedArtifact, versions };
	} catch (error) {
		throw BackpackError.database(
			"Failed to get artifact with versions",
			error
		);
	}
}

export async function getLatestArtifactVersion({
	artifactId,
	userId,
}: {
	artifactId: string;
	userId: string;
}): Promise<ArtifactVersion | null> {
	try {
		const [row] = await db
			.select({ version: artifactVersion })
			.from(artifactVersion)
			.innerJoin(artifact, eq(artifactVersion.artifactId, artifact.id))
			.where(
				and(eq(artifact.id, artifactId), eq(artifact.userId, userId))
			)
			.orderBy(desc(artifactVersion.versionNumber))
			.limit(1);

		return row?.version ?? null;
	} catch (error) {
		throw BackpackError.database(
			"Failed to get latest artifact version",
			error
		);
	}
}

export async function appendArtifactVersion({
	artifactId,
	userId,
	content,
	source,
	messageId,
	restoredFromVersionId,
}: {
	artifactId: string;
	userId: string;
	content: string;
	source: ArtifactVersionSource;
	messageId?: string;
	restoredFromVersionId?: string;
}): Promise<ArtifactVersion> {
	try {
		return await db.transaction(async (tx) => {
			const [selectedArtifact] = await tx
				.select()
				.from(artifact)
				.where(
					and(
						eq(artifact.id, artifactId),
						eq(artifact.userId, userId)
					)
				)
				.limit(1);

			if (!selectedArtifact) {
				throw new Error("Artifact not found");
			}

			const [maxVersion] = await tx
				.select({
					value: sql<number>`coalesce(max(${artifactVersion.versionNumber}), 0)`,
				})
				.from(artifactVersion)
				.where(eq(artifactVersion.artifactId, artifactId));

			const nextVersionNumber = (maxVersion?.value ?? 0) + 1;

			const [createdVersion] = await tx
				.insert(artifactVersion)
				.values({
					artifactId,
					versionNumber: nextVersionNumber,
					content,
					source,
					messageId,
					restoredFromVersionId,
					createdAt: new Date(),
				})
				.returning();

			if (!createdVersion) {
				throw new Error("Artifact version insert returned no rows");
			}

			await tx
				.update(artifact)
				.set({ updatedAt: new Date() })
				.where(eq(artifact.id, artifactId));

			return createdVersion;
		});
	} catch (error) {
		throw BackpackError.database(
			"Failed to append artifact version",
			error
		);
	}
}

export async function renameArtifact({
	artifactId,
	userId,
	title,
}: {
	artifactId: string;
	userId: string;
	title: string;
}): Promise<Artifact | null> {
	try {
		const [updatedArtifact] = await db
			.update(artifact)
			.set({ title, updatedAt: new Date() })
			.where(
				and(eq(artifact.id, artifactId), eq(artifact.userId, userId))
			)
			.returning();

		return updatedArtifact ?? null;
	} catch (error) {
		throw BackpackError.database("Failed to rename artifact", error);
	}
}

export async function restoreArtifactVersion({
	artifactId,
	versionId,
	userId,
}: {
	artifactId: string;
	versionId: string;
	userId: string;
}): Promise<ArtifactVersion> {
	try {
		const [selectedVersion] = await db
			.select({ version: artifactVersion })
			.from(artifactVersion)
			.innerJoin(artifact, eq(artifactVersion.artifactId, artifact.id))
			.where(
				and(
					eq(artifact.id, artifactId),
					eq(artifact.userId, userId),
					eq(artifactVersion.id, versionId)
				)
			)
			.limit(1);

		if (!selectedVersion) {
			throw new Error("Artifact version not found");
		}

		return await appendArtifactVersion({
			artifactId,
			userId,
			content: selectedVersion.version.content,
			source: "restore",
			restoredFromVersionId: versionId,
		});
	} catch (error) {
		throw BackpackError.database(
			"Failed to restore artifact version",
			error
		);
	}
}

export async function assertArtifactBelongsToChat({
	artifactId,
	chatId,
	userId,
}: {
	artifactId: string;
	chatId: string;
	userId: string;
}): Promise<Artifact> {
	try {
		const [selectedArtifact] = await db
			.select()
			.from(artifact)
			.where(
				and(
					eq(artifact.id, artifactId),
					eq(artifact.chatId, chatId),
					eq(artifact.userId, userId)
				)
			)
			.limit(1);

		if (!selectedArtifact) {
			throw new Error("Artifact not found");
		}

		return selectedArtifact;
	} catch (error) {
		throw BackpackError.database(
			"Failed to verify artifact ownership",
			error
		);
	}
}
