import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import type { ProxyConfig } from "./proxy-config.js";

export type ProxyTargetResult =
  | { address: string; url: URL }
  | {
      statusCode: number;
      error: string;
      message: string;
    };

export const validateProxyTarget = async (
  rawUrl: string | undefined,
  config: ProxyConfig
): Promise<ProxyTargetResult> => {
  if (!rawUrl) {
    return {
      statusCode: 400,
      error: "INVALID_URL",
      message: "Proxy request URL is required."
    };
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return {
      statusCode: 400,
      error: "INVALID_URL",
      message: "Proxy request URL is invalid."
    };
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    return {
      statusCode: 400,
      error: "UNSUPPORTED_PROTOCOL",
      message: "Only HTTP(S) is supported."
    };
  }

  if (
    config.allowedHosts.length === 0 ||
    !config.allowedHosts.includes(url.hostname.toLowerCase())
  ) {
    return {
      statusCode: 403,
      error: "HOST_NOT_ALLOWED",
      message: "Target host is not allowed by proxy configuration."
    };
  }

  const normalizedHostname = normalizeIpv4MappedIpv6(url.hostname);
  const addresses = isIP(normalizedHostname)
    ? [{ address: normalizedHostname }]
    : await lookup(url.hostname, { all: true });

  if (
    addresses.some(({ address }) => isPrivateAddress(address)) &&
    !config.allowPrivateTargets
  ) {
    return {
      statusCode: 403,
      error: "PRIVATE_IP_BLOCKED",
      message:
        "Target host resolves to a blocked private address. For local self-hosted proxy mode, set PROXY_ALLOW_PRIVATE_TARGETS=true."
    };
  }

  return { address: addresses[0]?.address ?? normalizedHostname, url };
};

export const sanitizeForwardHeaders = (
  headers: Record<string, string> | undefined
): Record<string, string> => {
  return Object.fromEntries(
    Object.entries(headers ?? {}).filter(
      ([name]) => !BLOCKED_FORWARD_HEADERS.has(name.toLowerCase())
    )
  );
};

export const sanitizeProxyResponseHeaders = (
  headers: Headers
): Record<string, string> => {
  return Object.fromEntries(
    Array.from(headers.entries()).filter(
      ([name]) => !BLOCKED_RESPONSE_HEADERS.has(name.toLowerCase())
    )
  );
};

const isPrivateAddress = (address: string): boolean => {
  if (address === "localhost") {
    return true;
  }

  const normalized = normalizeIpv4MappedIpv6(address);
  if (isIP(normalized) === 4) {
    return isPrivateOrSpecialIpv4(normalized);
  }

  if (isIP(normalized) === 6) {
    return isPrivateOrSpecialIpv6(normalized);
  }

  return true;
};

const BLOCKED_FORWARD_HEADERS = new Set([
  "connection",
  "content-length",
  "expect",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade"
]);

const BLOCKED_RESPONSE_HEADERS = new Set([
  "connection",
  "content-length",
  "keep-alive",
  "proxy-authenticate",
  "set-cookie",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade"
]);

const normalizeIpv4MappedIpv6 = (address: string): string => {
  const unwrapped =
    address.startsWith("[") && address.endsWith("]")
      ? address.slice(1, -1)
      : address;
  const lower = unwrapped.toLowerCase();
  const mappedPrefix = "::ffff:";

  if (lower.startsWith(mappedPrefix)) {
    const suffix = unwrapped.slice(mappedPrefix.length);

    if (suffix.includes(".")) {
      return suffix;
    }

    const parts = suffix.split(":");
    if (parts.length === 2) {
      const high = parseInt(parts[0] ?? "", 16);
      const low = parseInt(parts[1] ?? "", 16);

      if (Number.isFinite(high) && Number.isFinite(low)) {
        return [
          (high >> 8) & 255,
          high & 255,
          (low >> 8) & 255,
          low & 255
        ].join(".");
      }
    }
  }

  return unwrapped;
};

const isPrivateOrSpecialIpv4 = (address: string): boolean => {
  const value = ipv4ToNumber(address);

  return [
    ["0.0.0.0", 8],
    ["10.0.0.0", 8],
    ["100.64.0.0", 10],
    ["127.0.0.0", 8],
    ["169.254.0.0", 16],
    ["172.16.0.0", 12],
    ["192.0.0.0", 24],
    ["192.0.2.0", 24],
    ["192.168.0.0", 16],
    ["198.18.0.0", 15],
    ["198.51.100.0", 24],
    ["203.0.113.0", 24],
    ["224.0.0.0", 4],
    ["240.0.0.0", 4]
  ].some(([range, bits]) =>
    isIpv4InCidr(value, range as string, bits as number)
  );
};

const isPrivateOrSpecialIpv6 = (address: string): boolean => {
  const lower = address.toLowerCase();

  if (lower === "::" || lower === "::1") {
    return true;
  }

  return (
    isIpv6InPrefix(lower, "fc", 7) ||
    isIpv6InPrefix(lower, "fe80", 10) ||
    isIpv6InPrefix(lower, "ff", 8)
  );
};

const ipv4ToNumber = (address: string): number => {
  return (
    address
      .split(".")
      .map(Number)
      .reduce((total, octet) => (total << 8) + octet, 0) >>> 0
  );
};

const isIpv4InCidr = (
  value: number,
  rangeStart: string,
  bits: number
): boolean => {
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (value & mask) === (ipv4ToNumber(rangeStart) & mask);
};

const isIpv6InPrefix = (
  address: string,
  prefixHex: string,
  bits: number
): boolean => {
  const value = parseInt(address.replaceAll(":", "").slice(0, 4), 16);
  const prefix = parseInt(prefixHex.padEnd(4, "0"), 16);
  const mask = (0xffff << (16 - bits)) & 0xffff;

  return (value & mask) === (prefix & mask);
};
