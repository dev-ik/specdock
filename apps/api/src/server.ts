import { buildApp } from "./app.js";
import { loadDotEnv } from "./env.js";

loadDotEnv();

const app = buildApp();
const port = Number(process.env.PORT ?? process.env.APP_PORT ?? 3000);
const host = process.env.HOST ?? process.env.APP_IP ?? "0.0.0.0";

app.listen({ port, host }).catch((error: unknown) => {
  app.log.error(error);
  process.exit(1);
});
