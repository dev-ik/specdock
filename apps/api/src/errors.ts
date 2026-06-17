import type { FastifyReply } from "fastify";
import type { ApiError } from "@specdock/core";

export const sendError = (
  reply: FastifyReply,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown
): FastifyReply => {
  const payload: ApiError = {
    error: {
      code,
      message,
      details
    }
  };

  return reply.status(statusCode).send(payload);
};

export const generationErrorCode = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return "GENERATION_FAILED";
  }

  if (error.message.includes("OpenAPI 3")) {
    return "UNSUPPORTED_OPENAPI_VERSION";
  }

  if (error.message.includes("Specification")) {
    return "INVALID_SPEC";
  }

  return "GENERATION_FAILED";
};
