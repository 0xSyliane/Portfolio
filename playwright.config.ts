import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

/**
 * Chromium comes from the system (`CHROMIUM_PATH`, else /usr/bin/chromium) so
 * no browser download is needed. TMPDIR=/dev/shm avoids /tmp quota crashes.
 */
const executablePath =
  process.env["CHROMIUM_PATH"] ?? (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined);

const PORT = 4322;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env["CI"]),
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "off",
    launchOptions: { executablePath, args: ["--no-sandbox"] },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run build && npm run preview -- --host 127.0.0.1 --ignore-lock`,
    url: `http://127.0.0.1:${PORT}/fr/`,
    reuseExistingServer: !process.env["CI"],
    timeout: 120_000,
    env: { TMPDIR: process.env["TMPDIR"] ?? "/dev/shm" },
  },
});
