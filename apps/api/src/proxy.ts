import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import type { ProxyConfig } from "./proxy-config.js";

export type ProxyTargetResult =
  | { url: URL }
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
    return { statusCode: 400, error: "INVALID_URL", message: "Proxy request URL is required." };
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { statusCode: 400, error: "INVALID_URL", message: "Proxy request URL is invalid." };
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    return { statusCode: 400, error: "UNSUPPORTED_PROTOCOL", message: "Only HTTP(S) is supported." };
  }

  if (config.allowedHosts.length === 0 || !config.allowedHosts.includes(url.hostname.toLowerCase())) {
    return {
      statusCode: 403,
      error: "HOST_NOT_ALLOWED",
      message: "Target host is not allowed by proxy configuration."
    };
  }

  const addresses = isIP(url.hostname)
    ? [{ address: url.hostname }]
    : await lookup(url.hostname, { all: true });

  if (addresses.some(({ address }) => isPrivateAddress(address)) && !config.allowPrivateTargets) {
    return {
      statusCode: 403,
      error: "PRIVATE_IP_BLOCKED",
      message:
        "Target host resolves to a blocked private address. For local self-hosted proxy mode, set PROXY_ALLOW_PRIVATE_TARGETS=true."
    };
  }

  return { url };
};

export const sanitizeForwardHeaders = (
  headers: Record<string, string> | undefined
): Record<string, string> => {
  const blockedHeaders = new Set(["host", "content-length"]);
  return Object.fromEntries(
    Object.entries(headers ?? {}).filter(([name]) => !blockedHeaders.has(name.toLowerCase()))
  );
};

const isPrivateAddress = (address: string): boolean => {
  if (address === "localhost" || address === "0.0.0.0" || address === "127.0.0.1" || address === "::1") {
    return true;
  }

  if (address.startsWith("10.") || address.startsWith("192.168.") || address.startsWith("169.254.")) {
    return true;
  }

  const [firstOctet, secondOctet] = address.split(".").map(Number);
  if (firstOctet === 172 && secondOctet !== undefined && secondOctet >= 16 && secondOctet <= 31) {
    return true;
  }

  const lower = address.toLowerCase();
  return lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80:");
};
