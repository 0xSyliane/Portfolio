import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

/**
 * Runs the e2e specs against an ALREADY RUNNING server (dev or preview), never builds:
 *   npx astro dev --port 4324 --ignore-lock &
 *   E2E_BASE_URL=http://localhost:4324 npx playwright test -c tests/e2e/dev.config.ts
 */
const executablePath =
  process.env["CHROMIUM_PATH"] ?? (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined);

export default defineConfig({
  testDir: ".",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  retries: 0,
  reporter: [["list"]],
  outputDir: "../../test-results/dev",
  use: {
    baseURL: process.env["E2E_BASE_URL"] ?? "http://localhost:4324",
    trace: "off",
    launchOptions: { executablePath, args: ["--no-sandbox"] },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
