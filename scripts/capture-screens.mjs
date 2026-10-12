// @ts-check
// Captures the two public case-study sites into src/assets/work/<slug>/.
// Usage: node scripts/capture-screens.mjs [slug ...]   (TMPDIR=/dev/shm is forced)
// Only public production URLs belong here: NEVER a merchant or prospect preview.
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

process.env.TMPDIR ??= "/dev/shm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const executablePath =
  process.env.CHROMIUM_PATH ?? (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined);

// blaze-type has no phone sheet: its mobile layout clips the typing area (600 px minimum
// width) and would misrepresent the work. `typeDemo` types a few words so the capture
// shows the app mid-test instead of an empty page.
// `colorScheme`: Blaze Type renders its live WPM / accuracy values in white, which is invisible on its light
// theme, so it is captured in its (system-selected) dark theme where the numbers show.
// `desktop` overrides the desktop viewport: Blaze Type is shot at 16:9 (1280x720) so the sheet shows
// the logo, the live WPM / accuracy and the typing area instead of a mostly white 1440x900 page.
const TARGETS = [
  { slug: "blaze-type", url: "https://blaze-type.vercel.app/", phone: false, typeDemo: true, desktop: { width: 1280, height: 720 }, colorScheme: "dark" },
  { slug: "shellmates", url: "https://www.shellmates.club/", phone: true, typeDemo: false, desktop: undefined, colorScheme: "light" },
  { slug: "alcodefi", url: "https://www.alcodefi.org/", phone: false, typeDemo: false, desktop: { width: 1280, height: 720 }, colorScheme: "light" },
];

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900, mobile: false },
  { name: "phone", width: 390, height: 844, mobile: true },
];

/**
 * Scrolls to the bottom in steps (triggers lazy content) and back to the top.
 * @param {import("@playwright/test").Page} page
 */
async function warmUp(page) {
  await page.evaluate(async () => {
    const step = Math.max(200, Math.floor(window.innerHeight / 2));
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 150));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(800);
}

/**
 * Types the first words of the displayed test (blaze-type) to show progress colours.
 * @param {import("@playwright/test").Page} page
 */
async function typeDemo(page) {
  const text = await page.evaluate(() => {
    const candidates = [...document.querySelectorAll("div, p, span")].filter(
      (el) => el.children.length < 2 && (el.textContent ?? "").trim().split(/\s+/).length > 20,
    );
    return candidates.map((el) => el.textContent ?? "").sort((a, b) => b.length - a.length)[0] ?? "";
  });
  const all = text.trim().split(/\s+/);
  if (all.length < 12) throw new Error("typeDemo: the typing test text was not found");
  // Type most of the first line correctly, then one wrong key, so the sheet shows both progress colours.
  const words = all.slice(0, 16).join(" ") + " ";
  await page.keyboard.type(words, { delay: 140 });
  await page.keyboard.type("x", { delay: 140 });
  // WPM / accuracy refresh on a timer: wait until both are filled.
  await page.waitForFunction(() => /WPM:\s*\d/.test(document.body.innerText) && /Accuracy:\s*\d/.test(document.body.innerText), undefined, { timeout: 8000 });
  await page.waitForTimeout(400);
}

const manifestPath = join(root, "src/assets/work/captures.json");
const manifest = existsSync(manifestPath) ? JSON.parse(await readFile(manifestPath, "utf8")) : {};

const wanted = new Set(process.argv.slice(2));
const known = new Set(TARGETS.map((t) => t.slug));
for (const slug of wanted) if (!known.has(slug)) throw new Error(`unknown slug "${slug}" (known: ${[...known].join(", ")})`);
let captured = 0;
const browser = await chromium.launch({ executablePath, args: ["--no-sandbox"] });
try {
  for (const target of TARGETS) {
    if (wanted.size > 0 && !wanted.has(target.slug)) continue;
    const dir = join(root, "src/assets/work", target.slug);
    await mkdir(dir, { recursive: true });
    for (const vp of VIEWPORTS) {
      if (vp.mobile && !target.phone) continue;
      const size = !vp.mobile && target.desktop ? target.desktop : vp;
      const context = await browser.newContext({
        viewport: { width: size.width, height: size.height },
        deviceScaleFactor: 2,
        isMobile: vp.mobile,
        hasTouch: vp.mobile,
        locale: "fr-FR",
        colorScheme: /** @type {"light" | "dark"} */ (target.colorScheme),
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      const response = await page.goto(target.url, { waitUntil: "networkidle", timeout: 45_000 });
      if (!response?.ok()) throw new Error(`${target.url} answered HTTP ${response?.status() ?? "none"}`);
      await warmUp(page);
      if (target.typeDemo) await typeDemo(page);
      const file = join(dir, `${vp.name}.png`);
      await page.screenshot({ path: file, fullPage: false });
      manifest[target.slug] = { ...manifest[target.slug], capturedAt: new Date().toISOString().slice(0, 10) };
      captured += 1;
      console.log(`captured ${target.slug}/${vp.name}.png`);
      await context.close();
    }
  }
} finally {
  await browser.close();
  // Only stamp the manifest when something was actually captured.
  if (captured > 0) await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}
