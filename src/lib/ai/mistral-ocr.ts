import { Mistral } from "@mistralai/mistralai";
import { env } from "@/lib/env.mjs";

const OCR_MODEL = "mistral-ocr-2512";

const mistral = new Mistral({
	apiKey: env.MISTRAL_API_KEY,
});

interface OcrPage {
	markdown?: string;
	text?: string;
	content?: string;
}

interface OcrResult {
	pages?: OcrPage[];
	document?: {
		pages?: OcrPage[];
	};
	text?: string;
	markdown?: string;
	content?: string;
}

const normalizeText = (value: string) => {
	return value
		.replace(/\r\n/g, "\n")
		.replace(/[ \t]+\n/g, "\n")
		.replace(/\n{3,}/g, "\n\n")
		.replace(/[ \t]{2,}/g, " ")
		.trim();
};

const extractPageText = (pages: OcrPage[]) => {
	return pages
		.map((page) => page.markdown ?? page.text ?? page.content ?? "")
		.filter((text) => text.trim().length > 0);
};

export async function extractTextFromPdfUrl(documentUrl: string) {
	if (!documentUrl) {
		throw new Error("Document URL is required");
	}

	const result = (await mistral.ocr.process({
		model: OCR_MODEL,
		document: {
			type: "document_url",
			documentUrl,
		},
	})) as OcrResult;

	const pages = result.pages ?? result.document?.pages ?? [];
	const pageText = extractPageText(pages).join("\n\n");
	const topLevelText = result.text || result.markdown || result.content || "";
	const combinedText = pageText || topLevelText;
	const normalizedText = normalizeText(combinedText);

	if (!normalizedText) {
		throw new Error("Mistral OCR returned empty content");
	}

	return normalizedText;
}
