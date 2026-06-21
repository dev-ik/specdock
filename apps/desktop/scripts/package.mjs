import { spawn } from "node:child_process";

const target = process.argv[2] ?? "--dir";
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const builderArgs =
  target === "--dir"
    ? ["electron-builder", "--dir", "--publish", "never"]
    : ["electron-builder", target, "--publish", "never"];
const emptySigningEnvNames = [
  "CSC_LINK",
  "CSC_NAME",
  "CSC_KEY_PASSWORD",
  "WIN_CSC_LINK",
  "WIN_CSC_KEY_PASSWORD",
  "APPLE_API_KEY",
  "APPLE_API_KEY_ID",
  "APPLE_API_ISSUER"
];
const hasSigningConfig =
  process.env.CSC_LINK ||
  process.env.CSC_NAME ||
  process.env.WIN_CSC_LINK;
const builderEnv = hasSigningConfig ? {} : { CSC_IDENTITY_AUTO_DISCOVERY: "false" };

await run(npmCommand, ["run", "build", "--workspace", "@specdock/web"]);
await run(npmCommand, ["run", "build"]);
await run(npmCommand, ["exec", "--", ...builderArgs], builderEnv);

function run(command, args, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      ...extraEnv
    };

    delete env.ELECTRON_RUN_AS_NODE;
    for (const name of emptySigningEnvNames) {
      if (env[name] === "") {
        delete env[name];
      }
    }

    const child = spawn(command, args, {
      env,
      shell: false,
      stdio: "inherit"
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} failed with code ${code}`));
    });
  });
}
