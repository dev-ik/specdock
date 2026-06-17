import { readFileSync } from "node:fs";
import { generateSdk, generateSdkZip } from "@specdock/generator";
import type { GenerationJob } from "./generation-runner.js";

type GenerationChildMessage =
  | {
      ok: true;
      result:
        | { kind: "files"; files: ReturnType<typeof generateSdk> }
        | { kind: "zip"; archiveBase64: string };
    }
  | { ok: false; error: { name: string; message: string } };

const writeMessage = (message: GenerationChildMessage) => {
  process.stdout.write(JSON.stringify(message));
};

try {
  const job = JSON.parse(readFileSync(0, "utf8")) as GenerationJob;

  if (job.kind === "zip") {
    const archive = await generateSdkZip(job.spec, job.options);
    writeMessage({
      ok: true,
      result: {
        kind: "zip",
        archiveBase64: Buffer.from(archive).toString("base64")
      }
    });
  } else {
    writeMessage({
      ok: true,
      result: { kind: "files", files: generateSdk(job.spec, job.options) }
    });
  }
} catch (error) {
  writeMessage({
    ok: false,
    error: {
      name: error instanceof Error ? error.name : "Error",
      message: error instanceof Error ? error.message : "SDK generation failed."
    }
  });
}
