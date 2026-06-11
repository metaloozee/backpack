import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const HTTPS_PROTOCOL = "https:";
const IPV4_PART_COUNT = 4;

const parseIpv4 = (address: string): number[] | null => {
	const parts = address.split(".");
	if (parts.length !== IPV4_PART_COUNT) {
		return null;
	}

	const bytes: number[] = [];
	for (const part of parts) {
		if (!/^\d+$/.test(part)) {
			return null;
		}
		const value = Number(part);
		if (!Number.isInteger(value) || value < 0 || value > 255) {
			return null;
		}
		bytes.push(value);
	}

	return bytes;
};

const isPrivateIpv4 = (address: string): boolean => {
	const bytes = parseIpv4(address);
	if (!bytes) {
		return false;
	}

	const [first = 0, second = 0] = bytes;
	return (
		first === 10 ||
		first === 127 ||
		(first === 172 && second >= 16 && second <= 31) ||
		(first === 192 && second === 168) ||
		(first === 169 && second === 254) ||
		first === 0 ||
		first >= 224
	);
};

const getMappedIpv4 = (address: string): string | null => {
	const normalized = address.toLowerCase();
	const mappedPrefix = "::ffff:";
	if (!normalized.startsWith(mappedPrefix)) {
		return null;
	}
	return normalized.slice(mappedPrefix.length);
};

const isPrivateIpv6 = (address: string): boolean => {
	const normalized = address.toLowerCase();
	const mappedIpv4 = getMappedIpv4(normalized);
	if (mappedIpv4) {
		return isPrivateIpv4(mappedIpv4);
	}

	const firstSegment = normalized.split(":")[0] ?? "";
	const firstValue = Number.parseInt(firstSegment, 16);

	return (
		normalized === "::1" ||
		normalized === "::" ||
		(firstValue >= 0xfc00 && firstValue <= 0xfdff) ||
		(firstValue >= 0xfe80 && firstValue <= 0xfebf) ||
		(firstValue >= 0xff00 && firstValue <= 0xffff)
	);
};

const isBlockedAddress = (address: string): boolean => {
	const family = isIP(address);
	if (family === 4) {
		return isPrivateIpv4(address);
	}
	if (family === 6) {
		return isPrivateIpv6(address);
	}
	return true;
};

export async function assertPublicHttpsUrl(rawUrl: string): Promise<string> {
	let parsedUrl: URL;
	try {
		parsedUrl = new URL(rawUrl);
	} catch {
		throw new Error("URL must be valid");
	}

	if (parsedUrl.protocol !== HTTPS_PROTOCOL) {
		throw new Error("MCP server URL must use HTTPS");
	}

	if (parsedUrl.username || parsedUrl.password) {
		throw new Error("MCP server URL must not include credentials");
	}

	const hostname = parsedUrl.hostname;
	const directIp = isIP(hostname);
	if (directIp !== 0 && isBlockedAddress(hostname)) {
		throw new Error("MCP server URL must resolve to a public address");
	}

	const addresses = await lookup(hostname, { all: true, verbatim: false });
	if (addresses.length === 0) {
		throw new Error("MCP server URL hostname could not be resolved");
	}

	for (const { address } of addresses) {
		if (isBlockedAddress(address)) {
			throw new Error("MCP server URL must resolve to a public address");
		}
	}

	return parsedUrl.toString();
}
