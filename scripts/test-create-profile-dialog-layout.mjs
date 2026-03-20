import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const source = readFileSync("src/components/create-profile-dialog.tsx", "utf8");

assert.match(
  source,
  /<DialogContent className="(?=[^"]*max-h-\[90vh\])(?=[^"]*\bflex\b)(?=[^"]*\bflex-col\b)(?=[^"]*\bp-0\b)[^"]*"/,
  "Create Profile dialog should use the same clipped flex-column pattern as the dialogs that already scroll correctly",
);

assert.match(
  source,
  /sm:max-w-5xl/,
  "Create Profile dialog should keep the original wider modal size",
);

assert.doesNotMatch(
  source,
  /sm:max-w-4xl/,
  "Create Profile dialog should not use the reduced 4xl max width",
);

assert.match(
  source,
  /<ScrollArea className="[^"]*min-h-0[^"]*flex-1[^"]*"/,
  "Create Profile dialog should keep the body inside a shrinkable ScrollArea",
);

assert.match(
  source,
  /<Tabs[^>]*className="(?=[^"]*\bflex\b)(?=[^"]*\bmin-h-0\b)(?=[^"]*\bw-full\b)(?=[^"]*\bflex-1\b)(?=[^"]*\bflex-col\b)[^"]*"/s,
  "Create Profile dialog tabs should fill the middle area and remain shrinkable",
);

console.log("create-profile layout guard passed");
