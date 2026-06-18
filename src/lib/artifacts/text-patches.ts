import type {
	MarkdownSection,
	MarkdownSectionIndex,
} from "./markdown-sections";

export type TextArtifactPatchOperation =
	| {
			type: "replace_section";
			sectionId: string;
			content: string;
	  }
	| {
			type: "insert_before_section";
			sectionId: string;
			content: string;
	  }
	| {
			type: "insert_after_section";
			sectionId: string;
			content: string;
	  }
	| {
			type: "delete_section";
			sectionId: string;
	  }
	| {
			type: "replace_text";
			sectionId: string;
			find: string;
			replace: string;
	  };

interface Replacement {
	end: number;
	label: string;
	start: number;
	value: string;
}

export interface ApplyTextArtifactPatchOperationsResult {
	content: string;
	summary: string;
}

const getSectionLabel = (section: MarkdownSection): string =>
	section.heading ?? "document";

const ensureTrailingNewline = (value: string): string =>
	value.endsWith("\n") ? value : `${value}\n`;

const countOccurrences = (value: string, search: string): number => {
	if (!search) {
		return 0;
	}

	let count = 0;
	let position = value.indexOf(search);
	while (position !== -1) {
		count++;
		position = value.indexOf(search, position + search.length);
	}

	return count;
};

const getSection = ({
	index,
	sectionId,
}: {
	index: MarkdownSectionIndex;
	sectionId: string;
}): MarkdownSection => {
	const section = index.sections.find((item) => item.id === sectionId);
	if (!section) {
		throw new Error(`Patch target section not found: ${sectionId}`);
	}

	return section;
};

const operationToReplacement = ({
	index,
	operation,
}: {
	index: MarkdownSectionIndex;
	operation: TextArtifactPatchOperation;
}): Replacement => {
	const section = getSection({ index, sectionId: operation.sectionId });
	const label = getSectionLabel(section);

	switch (operation.type) {
		case "replace_section":
			return {
				start: section.start,
				end: section.end,
				value: ensureTrailingNewline(operation.content),
				label: `Replaced ${label}`,
			};
		case "insert_before_section":
			return {
				start: section.start,
				end: section.start,
				value: ensureTrailingNewline(operation.content),
				label: `Inserted before ${label}`,
			};
		case "insert_after_section":
			return {
				start: section.end,
				end: section.end,
				value: ensureTrailingNewline(operation.content),
				label: `Inserted after ${label}`,
			};
		case "delete_section":
			return {
				start: section.start,
				end: section.end,
				value: "",
				label: `Deleted ${label}`,
			};
		case "replace_text": {
			const occurrences = countOccurrences(
				section.content,
				operation.find
			);
			if (occurrences !== 1) {
				throw new Error(
					`Patch find text matched ${occurrences} times in ${label}`
				);
			}

			const relativeStart = section.content.indexOf(operation.find);
			const start = section.start + relativeStart;
			return {
				start,
				end: start + operation.find.length,
				value: operation.replace,
				label: `Updated ${label}`,
			};
		}
	}
};

const assertNoOverlaps = (replacements: Replacement[]) => {
	const sorted = replacements.toSorted((a, b) => a.start - b.start);
	for (let index = 1; index < sorted.length; index++) {
		const previous = sorted[index - 1];
		const current = sorted[index];
		if (previous && current && previous.end > current.start) {
			throw new Error("Patch operations overlap");
		}
	}
};

export const applyTextArtifactPatchOperations = ({
	content,
	index,
	operations,
}: {
	content: string;
	index: MarkdownSectionIndex;
	operations: TextArtifactPatchOperation[];
}): ApplyTextArtifactPatchOperationsResult => {
	if (operations.length === 0) {
		throw new Error("At least one patch operation is required");
	}

	const replacements = operations.map((operation) =>
		operationToReplacement({ index, operation })
	);
	assertNoOverlaps(replacements);

	let nextContent = content;
	for (const replacement of replacements.toSorted(
		(a, b) => b.start - a.start
	)) {
		nextContent = `${nextContent.slice(0, replacement.start)}${replacement.value}${nextContent.slice(replacement.end)}`;
	}

	return {
		content: nextContent.trimEnd(),
		summary: replacements
			.map((replacement) => replacement.label)
			.join("; "),
	};
};
