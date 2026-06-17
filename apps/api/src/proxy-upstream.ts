import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { isIP } from "node:net";
import type { IncomingHttpHeaders, IncomingMessage } from "node:http";
import type { ProxyRequest } from "@specdock/core";
import type { ProxyTargetResult } from "./proxy.js";

type ValidatedProxyTarget = Extract<ProxyTargetResult, { url: URL }>;

export type UpstreamResponse = {
  status: number;
  statusText: string;
  headers: Headers;
  body: string;
};

export class ProxyResponseTooLargeError extends Error {
  constructor() {
    super("Proxy response body exceeds the configured limit.");
    this.name = "ProxyResponseTooLargeError";
  }
}

export const requestUpstream = async (
  target: ValidatedProxyTarget,
  proxyRequest: ProxyRequest,
  headers: Record<string, string>,
  maxResponseBodyBytes: number,
  signal: AbortSignal,
  fetchImplementation: typeof fetch
): Promise<UpstreamResponse> => {
  if (fetchImplementation !== fetch) {
    return requestWithFetch(
      target.url,
      proxyRequest,
      headers,
      maxResponseBodyBytes,
      signal,
      fetchImplementation
    );
  }

  return requestWithPinnedAddress(
    target,
    proxyRequest,
    headers,
    maxResponseBodyBytes,
    signal
  );
};

const requestWithFetch = async (
  url: URL,
  proxyRequest: ProxyRequest,
  headers: Record<string, string>,
  maxResponseBodyBytes: number,
  signal: AbortSignal,
  fetchImplementation: typeof fetch
): Promise<UpstreamResponse> => {
  const upstream = await fetchImplementation(url, {
    method: proxyRequest.method,
    headers,
    body: proxyRequest.body,
    redirect: "manual",
    signal
  });

  return {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: upstream.headers,
    body: await readFetchBody(upstream, maxResponseBodyBytes)
  };
};

const requestWithPinnedAddress = (
  target: ValidatedProxyTarget,
  proxyRequest: ProxyRequest,
  headers: Record<string, string>,
  maxResponseBodyBytes: number,
  signal: AbortSignal
): Promise<UpstreamResponse> => {
  const isHttps = target.url.protocol === "https:";
  const transport = isHttps ? httpsRequest : httpRequest;
  const requestHeaders = {
    ...headers,
    "accept-encoding": "identity",
    host: target.url.host
  };

  return new Promise((resolve, reject) => {
    const upstream = transport(
      {
        host: target.address,
        method: proxyRequest.method,
        path: `${target.url.pathname}${target.url.search}`,
        port: target.url.port ? Number(target.url.port) : isHttps ? 443 : 80,
        headers: requestHeaders,
        servername:
          isHttps && isIP(stripBrackets(target.url.hostname)) === 0
            ? target.url.hostname
            : undefined,
        signal
      },
      async (response) => {
        try {
          resolve({
            status: response.statusCode ?? 0,
            statusText: response.statusMessage ?? "",
            headers: headersFromIncoming(response.headers),
            body: await readIncomingBody(response, maxResponseBodyBytes)
          });
        } catch (error) {
          reject(error);
        }
      }
    );

    upstream.once("error", reject);
    upstream.end(proxyRequest.body);
  });
};

const readFetchBody = async (
  response: Response,
  maxBytes: number
): Promise<string> => {
  rejectOversizedContentLength(
    response.headers.get("content-length"),
    maxBytes
  );

  if (!response.body) {
    const text = await response.text();
    if (Buffer.byteLength(text, "utf8") > maxBytes) {
      throw new ProxyResponseTooLargeError();
    }
    return text;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      throw new ProxyResponseTooLargeError();
    }

    chunks.push(value);
  }

  return Buffer.concat(chunks).toString("utf8");
};

const readIncomingBody = (
  response: IncomingMessage,
  maxBytes: number
): Promise<string> => {
  rejectOversizedContentLength(response.headers["content-length"], maxBytes);

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;

    response.on("data", (chunk: Buffer) => {
      totalBytes += chunk.byteLength;
      if (totalBytes > maxBytes) {
        response.destroy(new ProxyResponseTooLargeError());
        return;
      }

      chunks.push(chunk);
    });
    response.once("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    response.once("error", reject);
  });
};

const rejectOversizedContentLength = (
  value: string | string[] | null | undefined,
  maxBytes: number
): void => {
  const firstValue = Array.isArray(value) ? value[0] : value;
  const contentLength = firstValue ? Number(firstValue) : undefined;

  if (
    contentLength !== undefined &&
    Number.isFinite(contentLength) &&
    contentLength > maxBytes
  ) {
    throw new ProxyResponseTooLargeError();
  }
};

const headersFromIncoming = (headers: IncomingHttpHeaders): Headers => {
  const result = new Headers();

  for (const [name, value] of Object.entries(headers)) {
    if (Array.isArray(value)) {
      for (const item of value) result.append(name, item);
    } else if (value !== undefined) {
      result.set(name, value);
    }
  }

  return result;
};

const stripBrackets = (value: string): string =>
  value.startsWith("[") && value.endsWith("]") ? value.slice(1, -1) : value;
