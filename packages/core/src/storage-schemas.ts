import { z } from "zod";
import type { AuthProfile, Environment, OpenApiProject, RequestHistoryItem, UserSettings } from "./types.js";

const recordSchema = z.record(z.string());
const sourceSchema = z.union([
  z.object({ type: z.literal("url"), url: z.string() }).strict(),
  z.object({ type: z.literal("file"), fileName: z.string() }).strict(),
  z.object({ type: z.literal("raw") }).strict()
]);

const projectSchema: z.ZodType<OpenApiProject> = z.object({
  id: z.string(),
  name: z.string(),
  source: sourceSchema,
  specFormat: z.enum(["openapi3", "swagger2"]).optional(),
  spec: z.unknown(),
  servers: z.array(z.unknown()),
  tags: z.array(z.unknown()),
  operations: z.array(z.unknown()),
  schemas: z.array(z.unknown()),
  createdAt: z.string(),
  updatedAt: z.string()
}) as z.ZodType<OpenApiProject>;

export const projectsSchema: z.ZodType<OpenApiProject[]> = z.array(projectSchema);
export const environmentsSchema: z.ZodType<Environment[]> = z.array(z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  baseUrl: z.string(),
  variables: recordSchema,
  createdAt: z.string(),
  updatedAt: z.string()
}) as z.ZodType<Environment>);
export const authProfilesSchema: z.ZodType<AuthProfile[]> = z.array(z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  type: z.enum(["none", "bearer", "apiKey", "basic", "cookieCsrf"]),
  values: recordSchema,
  createdAt: z.string(),
  updatedAt: z.string()
}) as z.ZodType<AuthProfile>);
export const historySchema: z.ZodType<RequestHistoryItem[]> = z.array(z.object({
  id: z.string(),
  projectId: z.string(),
  operationId: z.string().optional(),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]),
  url: z.string(),
  status: z.number().optional(),
  durationMs: z.number().optional(),
  createdAt: z.string()
}) as z.ZodType<RequestHistoryItem>);
export const settingsSchema: z.ZodType<UserSettings> = z.object({
  theme: z.enum(["dark", "light", "system"]),
  defaultClient: z.enum(["fetch", "axios"]),
  defaultRequestMode: z.enum(["direct", "proxy"])
});
