import type { FastifyServerOptions } from "fastify";

export const resolveTrustProxy = (
  value: string | undefined = process.env.TRUST_PROXY
): FastifyServerOptions["trustProxy"] => {
  const normalized = value?.trim().toLowerCase();

  if (!normalized || normalized === "false") {
    return false;
  }

  if (["loopback", "linklocal", "uniquelocal"].includes(normalized)) {
    return normalized;
  }

  const hopCount = Number(normalized);
  if (Number.isSafeInteger(hopCount) && hopCount > 0) {
    return hopCount;
  }

  return false;
};
