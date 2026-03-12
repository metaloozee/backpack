import "server-only";
import { createClient, type RedisClientType } from "redis";
import { env } from "@/lib/env.mjs";

declare global {
	var __backpackRedisClient: RedisClientType | undefined;
	var __backpackRedisConnectPromise: Promise<RedisClientType> | undefined;
}

const createRedisSingleton = (): RedisClientType => {
	return createClient({
		url: env.REDIS_URL,
	});
};

const redisClient = globalThis.__backpackRedisClient ?? createRedisSingleton();

if (!globalThis.__backpackRedisClient) {
	globalThis.__backpackRedisClient = redisClient;
	redisClient.on("error", (error: unknown) => {
		console.error("Redis client error", error);
	});
}

export const getRedisClient = (): Promise<RedisClientType> => {
	if (redisClient.isOpen) {
		return Promise.resolve(redisClient);
	}

	globalThis.__backpackRedisConnectPromise ??= redisClient
		.connect()
		.then(() => redisClient)
		.finally(() => {
			globalThis.__backpackRedisConnectPromise = undefined;
		});

	return globalThis.__backpackRedisConnectPromise;
};
