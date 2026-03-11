import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";

export const streamdownPlugins = {
	cjk,
	code,
	math,
	mermaid,
};

export interface CitationSource {
	description?: string;
	id?: string;
	title?: string;
	url?: string;
}

const CITATION_TAG_REGEX = /<citation\s+[^>]*\/?>/gi;
const ID_ATTR_REGEX = /id="([^"]*)"/;
const TITLE_ATTR_REGEX = /title="([^"]*)"/;
const DESC_ATTR_REGEX = /description="([^"]*)"/;
const URL_ATTR_REGEX = /url="([^"]*)"/;
const QUOTE_ATTR_REGEX = /quote="([^"]*)"/;

const PLACEHOLDER_PREFIX = "\u2063CITATION:";
const PLACEHOLDER_SUFFIX = "\u2063";
const PLACEHOLDER_RUN_REGEX = new RegExp(
	`(${escapeRegex(PLACEHOLDER_PREFIX)}[A-Za-z0-9+/=]+${escapeRegex(PLACEHOLDER_SUFFIX)})+`,
	"g"
);

function escapeRegex(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function base64Encode(str: string): string {
	const bytes = new TextEncoder().encode(str);
	let binary = "";
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}
	return btoa(binary);
}

function base64Decode(str: string): string {
	const binary = atob(str);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return new TextDecoder().decode(bytes);
}

function parseCitationAttributes(tag: string): CitationSource | null {
	const idMatch = tag.match(ID_ATTR_REGEX);
	const titleMatch = tag.match(TITLE_ATTR_REGEX);
	const descMatch = tag.match(DESC_ATTR_REGEX);
	const urlMatch = tag.match(URL_ATTR_REGEX);
	const quoteMatch = tag.match(QUOTE_ATTR_REGEX);
	if (!(titleMatch || urlMatch || descMatch)) {
		return null;
	}
	return {
		description: descMatch?.[1] ?? quoteMatch?.[1] ?? "",
		id: idMatch?.[1] ?? "",
		title: titleMatch?.[1] ?? "",
		url: urlMatch?.[1] ?? "",
	};
}

/**
 * Collapses adjacent `<citation ... />` tags into a single grouped citation
 * with an `items` attribute (base64-encoded JSON array). Ensures Streamdown
 * receives one component per citation run for proper multi-source rendering.
 */
export function normalizeCitationMarkup(markdown: string): string {
	let result = markdown.replace(CITATION_TAG_REGEX, (match) => {
		const parsed = parseCitationAttributes(match);
		if (!parsed) {
			return match;
		}
		return `${PLACEHOLDER_PREFIX}${base64Encode(JSON.stringify([parsed]))}${PLACEHOLDER_SUFFIX}`;
	});
	result = result.replace(PLACEHOLDER_RUN_REGEX, (run) => {
		const items: CitationSource[] = [];
		const parts = run.split(PLACEHOLDER_SUFFIX).filter(Boolean);
		for (const part of parts) {
			if (!part.startsWith("CITATION:")) {
				continue;
			}
			const b64 = part.slice(9);
			try {
				const decoded = JSON.parse(
					base64Decode(b64)
				) as CitationSource[];
				items.push(...decoded);
			} catch {
				// ignore malformed
			}
		}
		if (items.length === 0) {
			return run;
		}
		const encoded = base64Encode(JSON.stringify(items));
		return `<citation items="${encoded}" />`;
	});
	return result;
}
