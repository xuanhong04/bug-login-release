import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const source = readFileSync("src/components/app-sidebar.tsx", "utf8");

assert.doesNotMatch(
  source,
  /BugLogin/,
  "App sidebar should use the logo asset instead of hardcoded brand text",
);

assert.doesNotMatch(
  source,
  /collapsed && \(\n\s*<div className="px-3 pb-2">/,
  "Collapsed sidebar should not render a separate expand button block below the header",
);

assert.match(
  source,
  /onClick=\{\(\) => onCollapsedChange\(!collapsed\)\}/,
  "Sidebar should toggle collapse from the header row",
);

console.log("app sidebar layout guard passed");
