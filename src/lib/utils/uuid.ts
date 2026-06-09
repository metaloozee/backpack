const UUID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const toUuidList = (input: Record<string, boolean>): string[] => {
	const ids: string[] = [];

	for (const [id, enabled] of Object.entries(input)) {
		if (enabled && UUID_PATTERN.test(id)) {
			ids.push(id);
		}
	}

	return ids;
};
