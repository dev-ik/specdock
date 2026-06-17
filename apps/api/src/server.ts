import { buildApp } from "./app.js";
import { loadDotEnv } from "./env.js";

loadDotEnv();

const app = buildApp();
const port = Number(process.env.APP_PORT ?? process.env.PORT ?? 3000);
const host = process.env.APP_IP ?? process.env.HOST ?? "0.0.0.0";

app.listen({ port, host }).catch((error: unknown) => {
  app.log.error(error);
  process.exit(1);
});
