import { statSync } from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import type { FastifyReply } from "fastify";

export function resolveWebDistDir(): string | undefined {
  const moduleDir = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    process.env.WEB_DIST_DIR,
    join(process.cwd(), "apps", "web", "dist"),
    join(process.cwd(), "..", "web", "dist"),
    join(moduleDir, "..", "..", "web", "dist"),
    join(moduleDir, "..", "..", "..", "apps", "web", "dist")
  ].filter((candidate): candidate is string => Boolean(candidate));

  return candidates
    .map((candidate) => resolve(candidate))
    .find((candidate) => isDirectory(candidate));
}

export function requestPathname(rawUrl: string): string {
  try {
    return new URL(rawUrl, "http://specdock.local").pathname;
  } catch {
    return "/";
  }
}

export function resolveStaticAsset(
  root: string,
  pathname: string
): string | undefined {
  const relativePath =
    pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const candidate = resolve(root, relativePath);
  const candidateRelativeToRoot = relative(root, candidate);

  if (
    candidateRelativeToRoot.startsWith("..") ||
    candidateRelativeToRoot.includes(`..${sep}`)
  ) {
    return undefined;
  }

  return isFile(candidate) ? candidate : undefined;
}

export function setStaticHeaders(reply: FastifyReply, assetPath: string): void {
  reply.header("content-type", contentTypeFor(assetPath));
  reply.header(
    "cache-control",
    assetPath.includes(`${sep}assets${sep}`)
      ? "public, max-age=31536000, immutable"
      : "no-store"
  );
  reply.header("content-security-policy", securityPolicy());
  reply.header(
    "permissions-policy",
    "camera=(), microphone=(), geolocation=()"
  );
  reply.header("referrer-policy", "strict-origin-when-cross-origin");
  reply.header("x-content-type-options", "nosniff");
  reply.header("x-frame-options", "DENY");
}

function securityPolicy(): string {
  return [
    "default-src 'self'",
    "base-uri 'none'",
    "connect-src 'self' http: https:",
    "font-src 'self' data:",
    "form-action 'none'",
    "frame-ancestors 'none'",
    "img-src 'self' data:",
    "object-src 'none'",
    "script-src 'self'",
    "style-src 'self'"
  ].join("; ");
}

function contentTypeFor(assetPath: string): string {
  const types: Record<string, string> = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".ico": "image/x-icon",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".map": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".txt": "text/plain; charset=utf-8",
    ".webp": "image/webp",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".yaml": "application/yaml; charset=utf-8",
    ".yml": "application/yaml; charset=utf-8"
  };

  return types[extname(assetPath).toLowerCase()] ?? "application/octet-stream";
}

function isDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function isFile(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}
