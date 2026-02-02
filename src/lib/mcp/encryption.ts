import "server-only";

import crypto from "node:crypto";
import { env } from "@/lib/env.mjs";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const MASTER_KEY = Buffer.from(env.MCP_ENCRYPTION_KEY, "base64");

export interface EncryptedKeyPayload {
	iv_b64: string;
	tag_b64: string;
	ct_b64: string;
	v: number;
}

export type EncryptedKeyInput = EncryptedKeyPayload | string;

const isEncryptedKeyPayload = (
	value: unknown
): value is EncryptedKeyPayload => {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	const candidate = value as Partial<EncryptedKeyPayload>;
	return (
		typeof candidate.iv_b64 === "string" &&
		typeof candidate.tag_b64 === "string" &&
		typeof candidate.ct_b64 === "string" &&
		typeof candidate.v === "number"
	);
};

export function parseEncryptedKey(
	payload: EncryptedKeyInput
): EncryptedKeyPayload {
	if (typeof payload === "string") {
		try {
			const parsed = JSON.parse(payload) as unknown;
			if (!isEncryptedKeyPayload(parsed)) {
				throw new Error("Invalid encrypted key payload shape");
			}
			return parsed;
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			throw new Error(
				`Failed to parse MCP API key payload: ${errorMessage}`
			);
		}
	}

	if (!isEncryptedKeyPayload(payload)) {
		throw new Error(
			"Invalid encrypted key payload: must be a string or object with iv_b64, tag_b64, ct_b64, and v properties"
		);
	}

	return payload;
}

export function encryptKey(plaintext: string): EncryptedKeyPayload {
	try {
		const iv = crypto.randomBytes(IV_LENGTH);
		const cipher = crypto.createCipheriv(ALGORITHM, MASTER_KEY, iv);

		const ciphertext = Buffer.concat([
			cipher.update(plaintext, "utf8"),
			cipher.final(),
		]);
		const tag = cipher.getAuthTag();

		return {
			iv_b64: iv.toString("base64"),
			tag_b64: tag.toString("base64"),
			ct_b64: ciphertext.toString("base64"),
			v: 1,
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : String(error);
		throw new Error(`Failed to encrypt MCP API key: ${errorMessage}`);
	}
}

export function decryptKey(payload: EncryptedKeyPayload) {
	try {
		const iv = Buffer.from(payload.iv_b64, "base64");
		const tag = Buffer.from(payload.tag_b64, "base64");
		const ct = Buffer.from(payload.ct_b64, "base64");

		const decipher = crypto.createDecipheriv(ALGORITHM, MASTER_KEY, iv);
		decipher.setAuthTag(tag);

		const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
		return pt.toString("utf-8");
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : String(error);
		throw new Error(`Failed to decrypt MCP API key: ${errorMessage}`);
	}
}
