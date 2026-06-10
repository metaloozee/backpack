export const fetcher = async (url: string) => {
	const response = await fetch(url);
	if (!response.ok) {
		let errorMessage = `HTTP error! Status: ${response.status}`;
		try {
			const data = await response.json();
			if (data && typeof data === "object") {
				const code = data.code ?? response.statusText;
				const cause = data.cause ?? data.error ?? data.message ?? "";
				errorMessage = cause ? `${code}: ${cause}` : String(code);
			}
		} catch {
			// ignore JSON parsing errors for non-JSON responses (e.g. HTML pages)
		}
		throw new Error(errorMessage);
	}

	return response.json();
};

export async function fetchWithErrorHandlers(
	input: RequestInfo | URL,
	init?: RequestInit
) {
	try {
		const response = await fetch(input, init);

		if (!response.ok) {
			let errorMessage = `HTTP error! Status: ${response.status}`;
			try {
				const data = await response.json();
				if (data && typeof data === "object") {
					const code = data.code ?? response.statusText;
					const cause =
						data.cause ?? data.error ?? data.message ?? "";
					errorMessage = cause ? `${code}: ${cause}` : String(code);
				}
			} catch {
				// ignore JSON parsing errors for non-JSON responses (e.g. HTML pages)
			}
			throw new Error(errorMessage);
		}

		return response;
	} catch (error: unknown) {
		if (typeof navigator !== "undefined" && !navigator.onLine) {
			throw new Error("No internet connection");
		}

		throw error;
	}
}
