#!/usr/bin/env node

import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, "..");
const sidecarTargetDir = resolve(rootDir, ".sidecar-target");
const isWindows = process.platform === "win32";

function spawnPnpm(args, extraEnv = {}) {
  return spawn("pnpm", args, {
    cwd: rootDir,
    stdio: "inherit",
    shell: isWindows,
    env: {
      ...process.env,
      ...extraEnv,
    },
  });
}

const devProc = spawnPnpm(["dev"]);
const copyProc = spawnPnpm(["copy-proxy-binary"], {
  SIDECAR_CARGO_TARGET_DIR: sidecarTargetDir,
});

let copyDone = false;

copyProc.on("exit", (code, signal) => {
  copyDone = true;
  if (code === 0) {
    return;
  }
  if (!devProc.killed) {
    devProc.kill("SIGTERM");
  }
  const reason = signal ? `signal ${signal}` : `code ${code}`;
  console.error(`copy-proxy-binary failed (${reason})`);
  process.exit(typeof code === "number" ? code : 1);
});

devProc.on("exit", (code, signal) => {
  if (!copyDone && !copyProc.killed) {
    copyProc.kill("SIGTERM");
  }
  if (signal) {
    process.exit(1);
  }
  process.exit(code ?? 0);
});

process.on("SIGINT", () => {
  if (!devProc.killed) devProc.kill("SIGINT");
  if (!copyProc.killed) copyProc.kill("SIGINT");
});

process.on("SIGTERM", () => {
  if (!devProc.killed) devProc.kill("SIGTERM");
  if (!copyProc.killed) copyProc.kill("SIGTERM");
});
