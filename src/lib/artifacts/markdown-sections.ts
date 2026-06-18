const ATX_HEADING_PATTERN = /^(#{1,6})\s+(.+?)\s*#*\s*$/gm;
const NON_SLUG_CHAR_PATTERN = /[^a-z0-9]+/g;
const EDGE_DASH_PATTERN = /^-+|-+$/g;
const SNIPPET_LENGTH = 1200;
const TRAILING_SECTION_BLANK_PATTERN = /\n{2}$/;

export interface MarkdownSection {
	content: string;
	end: number;
	heading?: string;
	headingPath: string[];
	id: string;
	level: number;
	snippet: string;
	start: number;
}

export interface MarkdownSectionIndex {
	content: string;
	outline: Array<
		Pick<MarkdownSection, "id" | "heading" | "headingPath" | "level">
	>;
	sections: MarkdownSection[];
}

interface HeadingMatch {
	heading: string;
	level: number;
	start: number;
}

const slugify = (value: string): string => {
	const slug = value
		.trim()
		.toLowerCase()
		.replace(NON_SLUG_CHAR_PATTERN, "-")
		.replace(EDGE_DASH_PATTERN, "");

	return slug || "section";
};

const createSnippet = (content: string): string => {
	if (content.length <= SNIPPET_LENGTH) {
		return content;
	}

	return `${content.slice(0, SNIPPET_LENGTH).trimEnd()}…`;
};

const collectHeadings = (content: string): HeadingMatch[] => {
	const headings: HeadingMatch[] = [];

	for (const match of content.matchAll(ATX_HEADING_PATTERN)) {
		const marker = match[1];
		const rawHeading = match[2];
		if (!(marker && rawHeading)) {
			continue;
		}

		headings.push({
			heading: rawHeading.trim(),
			level: marker.length,
			start: match.index ?? 0,
		});
	}

	return headings;
};

const findSectionEnd = ({
	headings,
	index,
	contentLength,
}: {
	headings: HeadingMatch[];
	index: number;
	contentLength: number;
}): number => {
	const current = headings[index];
	if (!current) {
		return contentLength;
	}

	const nextPeerOrAncestor = headings
		.slice(index + 1)
		.find((heading) => heading.level <= current.level);

	return nextPeerOrAncestor?.start ?? contentLength;
};

export const indexMarkdownSections = (
	content: string
): MarkdownSectionIndex => {
	const headings = collectHeadings(content);
	const sections: MarkdownSection[] = [
		{
			id: "root",
			level: 0,
			headingPath: [],
			start: 0,
			end: content.length,
			content,
			snippet: createSnippet(content),
		},
	];

	if (headings.length === 0) {
		return {
			content,
			sections,
			outline: sections.map(({ id, heading, headingPath, level }) => ({
				id,
				heading,
				headingPath,
				level,
			})),
		};
	}

	const pathByLevel: string[] = [];
	const idByLevel: string[] = [];

	for (const [index, heading] of headings.entries()) {
		pathByLevel.length = heading.level - 1;
		idByLevel.length = heading.level - 1;
		pathByLevel[heading.level - 1] = heading.heading;
		idByLevel[heading.level - 1] =
			`h${heading.level}-${slugify(heading.heading)}`;

		const end = findSectionEnd({
			headings,
			index,
			contentLength: content.length,
		});
		const sectionContent = content
			.slice(heading.start, end)
			.replace(TRAILING_SECTION_BLANK_PATTERN, "\n");

		sections.push({
			id: idByLevel.filter(Boolean).join("/"),
			level: heading.level,
			heading: heading.heading,
			headingPath: pathByLevel.filter(Boolean),
			start: heading.start,
			end,
			content: sectionContent,
			snippet: createSnippet(sectionContent),
		});
	}

	return {
		content,
		sections,
		outline: sections.map(({ id, heading, headingPath, level }) => ({
			id,
			heading,
			headingPath,
			level,
		})),
	};
};
