import { getRedisClient } from "@/lib/redis";

const EMAIL_ALLOWLIST_KEY = "allowlist:emails";

const normalizeEmail = (email: string): string => {
	return email.trim().toLowerCase();
};

export const isEmailAllowlisted = async (email: string): Promise<boolean> => {
	const redis = await getRedisClient();
	const normalizedEmail = normalizeEmail(email);

	return (await redis.sIsMember(EMAIL_ALLOWLIST_KEY, normalizedEmail)) === 1;
};
