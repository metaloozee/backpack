import crypto from "node:crypto";
import { env } from "@/lib/env.mjs";

const ALGORITHM = "aes-256-gcm";
const AUTH_TAG_LENGTH = 16; // 128 bits
const IV_LENGTH = 12; // 96 bits (GCM standard)

export function encryptApiKey(plaintext: string): string {
	try {
		const key = Buffer.from(env.MCP_ENCRYPTION_KEY, "utf-8");

		if (key.length !== 32) {
			throw new Error("MCP_ENCRYPTION_KEY must be 32 bytes");
		}

		const iv = crypto.randomBytes(IV_LENGTH);
		const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

		let encrypted = cipher.update(plaintext, "utf8", "base64");
		encrypted += cipher.final("base64");
		const authTag = cipher.getAuthTag();

		// Prepend IV and authTag to ciphertext
		const combined = Buffer.concat([
			iv,
			authTag,
			Buffer.from(encrypted, "base64"),
		]);
		return combined.toString("base64");
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : String(error);
		throw new Error(`Failed to encrypt API key: ${errorMessage}`);
	}
}

export function decryptApiKey(ciphertext: string): string {
	try {
		const key = Buffer.from(env.MCP_ENCRYPTION_KEY, "utf-8");

		if (key.length !== 32) {
			throw new Error("MCP_ENCRYPTION_KEY must be 32 bytes");
		}

		const data = Buffer.from(ciphertext, "base64");

		if (data.length < IV_LENGTH + AUTH_TAG_LENGTH) {
			throw new Error("Invalid ciphertext: insufficient data");
		}

		const iv = data.subarray(0, IV_LENGTH);
		const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
		const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

		const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
		decipher.setAuthTag(authTag);

		let decrypted = decipher.update(encrypted, undefined, "utf8");
		decrypted += decipher.final("utf8");
		return decrypted;
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : String(error);
		throw new Error(`Failed to decrypt API key: ${errorMessage}`);
	}
}
