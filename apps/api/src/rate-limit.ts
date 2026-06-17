import type { FastifyReply, FastifyRequest } from "fastify";
import { sendError } from "./errors.js";

type RateLimitOptions = {
  maxRequests: number;
  windowMs: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

export const createRateLimit = (name: string, options: RateLimitOptions) => {
  const buckets = new Map<string, Bucket>();

  return async (request: FastifyRequest, reply: FastifyReply) => {
    const now = Date.now();
    const key = `${name}:${request.ip}`;
    const current = buckets.get(key);
    const bucket =
      current && current.resetAt > now
        ? current
        : { count: 0, resetAt: now + options.windowMs };

    bucket.count += 1;
    buckets.set(key, bucket);

    if (bucket.count <= options.maxRequests) {
      return;
    }

    reply.header(
      "retry-after",
      Math.ceil((bucket.resetAt - now) / 1000).toString()
    );
    return sendError(
      reply,
      429,
      "RATE_LIMITED",
      "Too many requests. Try again later."
    );
  };
};
