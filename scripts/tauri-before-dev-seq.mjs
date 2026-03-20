#!/usr/bin/env node

import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, "..");
const sidecarTargetDir = resolve(rootDir, ".sidecar-target");
const isWindows = process.platform === "win32";

function runPnpm(args, extraEnv = {}) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn("pnpm", args, {
      cwd: rootDir,
      stdio: "inherit",
      shell: isWindows,
      env: {
        ...process.env,
        ...extraEnv,
      },
    });

    child.on("error", rejectRun);
    child.on("exit", (code, signal) => {
      if (signal) {
        rejectRun(new Error(`pnpm ${args.join(" ")} exited by signal ${signal}`));
        return;
      }
      if (code !== 0) {
        rejectRun(new Error(`pnpm ${args.join(" ")} failed with code ${code}`));
        return;
      }
      resolveRun();
    });
  });
}

async function main() {
  await runPnpm(["copy-proxy-binary"], {
    SIDECAR_CARGO_TARGET_DIR: sidecarTargetDir,
  });
  await runPnpm(["dev"]);
}

main().catch((error) => {
  console.error(String(error));
  process.exit(1);
});
