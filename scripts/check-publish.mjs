#!/usr/bin/env node
// Pre-publication gate (decision D-03 / threat model H9). Run after `npm run build`.
// Exit 1 while anything is pending: unfinished [[placeholders]], preview URLs,
// inline styles/scripts, leftover noindex, un-reviewed concepts, stale CV PDFs,
// plain e-mail addresses, merchant names from scripts/.denylist.local.
import { fileURLToPath } from "node:url";
import { runChecks } from "./lib/publish-checks.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const problems = await runChecks(root);

if (problems.length > 0) {
  console.log(`✗ ${problems.length} issue(s) before publishing:\n`);
  console.log(problems.map((p) => `  • ${p}`).join("\n"));
  process.exit(1);
}
console.log("✓ Ready to publish: nothing pending.");
