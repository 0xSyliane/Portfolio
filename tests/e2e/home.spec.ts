import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const HOME = "/fr/";
const SECTION_IDS = ["hero", "travaux", "a-propos", "cv", "offres", "contact"];
const WIDTHS = [320, 390, 768, 1024, 1440];

/** Scrolls through the page so lazy images load and below-the-fold reveals fire. */
async function scrollThrough(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const step = Math.max(300, Math.floor(window.innerHeight * 0.6));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
    await new Promise((resolve) => setTimeout(resolve, 400));
  });
  await page.waitForLoadState("networkidle");
}

test.describe("home", () => {
  test("renders every section in order, with matching nav anchors", async ({ page }) => {
    await page.goto(HOME);
    const ids = await page.$$eval(".home > section", (sections) =>
      sections.map((s) => s.id || (s.classList.contains("hero") ? "hero" : "")),
    );
    expect(ids).toEqual(SECTION_IDS);

    await expect(page.getByRole("heading", { level: 1 })).toContainText("Syliane Saadbouzid");
    expect(await page.getByRole("heading", { level: 1 }).count()).toBe(1);

    const hashes = await page.$$eval('header nav a[href*="#"]', (links) =>
      links.map((a) => (a as HTMLAnchorElement).hash.slice(1)),
    );
    expect(hashes.length).toBeGreaterThan(0);
    for (const hash of hashes) {
      expect(await page.locator(`#${hash}`).count(), `#${hash} exists`).toBe(1);
    }
  });

  test("has no console error, no inline style, no inline script", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => msg.type() === "error" && errors.push(msg.text()));
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(HOME);
    await scrollThrough(page);
    expect(errors).toEqual([]);
    expect(await page.locator(".home [style]").count()).toBe(0);
    expect(await page.locator("main style, main script:not([src]):not([type])").count()).toBe(0);
  });

  for (const width of WIDTHS) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(HOME);
      await scrollThrough(page);
      const result = await page.evaluate(() => {
        const limit = document.documentElement.clientWidth;
        const offenders = Array.from(document.querySelectorAll<HTMLElement>("body *"))
          .filter((el) => !el.closest(".sr-only") && !el.classList.contains("sr-only"))
          .filter((el) => el.getBoundingClientRect().right > limit + 1 && getComputedStyle(el).position !== "fixed")
          .map((el) => `${el.tagName.toLowerCase()}.${el.className}`);
        return { scroll: document.documentElement.scrollWidth, limit, offenders: offenders.slice(0, 8) };
      });
      expect(result.scroll).toBeLessThanOrEqual(result.limit);
      expect(result.offenders).toEqual([]);
    });
  }

  test("contact: no inert e-mail link, no dead JavaScript note, LinkedIn and GitHub work", async ({ page }) => {
    await page.goto(HOME);
    const contact = page.locator("#contact");
    await expect(contact.locator("a[aria-disabled], a[href='#contact']")).toHaveCount(0);
    await expect(contact).not.toContainText("JavaScript requis");
    await expect(contact.getByRole("link", { name: /LinkedIn/ })).toHaveAttribute("href", /^https:\/\/www\.linkedin\.com\/in\//);
    await expect(contact.getByRole("link", { name: /GitHub/ })).toHaveAttribute("href", "https://github.com/0xSyliane");
    await expect(page.locator("#a-propos").getByRole("link", { name: "GitHub" })).toBeVisible();
    // No address, not even half of one, is assembled on load.
    expect(await page.content()).not.toMatch(/mailto:|[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
  });

  test("case links are distinct and statuses are readable words", async ({ page }) => {
    await page.goto(HOME);
    const names = await page.locator(".case__link").allInnerTexts();
    expect(names.map((n) => n.split("\n")[0]?.trim())).toEqual(["Voir le site Alcodefi", "Voir Blaze Type en ligne", "Voir le site Shellmates"]);
    await expect(page.locator(".case").first().locator(".stamp")).toHaveText(/Statut\s*:\s*En ligne/);
  });

  test("language switch comes after the nav links in DOM order and in the visual order, at 390px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("/en/cv/");
    const order = await page.$$eval(".site-header a", (links) =>
      links.map((a) => {
        const r = a.getBoundingClientRect();
        return { text: (a as HTMLElement).innerText.trim(), x: Math.round(r.x), y: Math.round(r.y + r.height / 2) };
      }),
    );
    const brand = order[0];
    const rest = order.slice(1);
    const sw = rest.at(-1);
    expect(brand?.text).toBe("Syliane Saadbouzid");
    expect(sw?.text).toBe("FR");
    expect(rest.slice(0, -1).every((l) => Math.abs(l.y - (sw?.y ?? 0)) <= 2 && l.x < (sw?.x ?? 0))).toBe(true);
    await expect(page.locator("header .site-header__switch")).toHaveAccessibleName("Français");
    await expect(page.locator('header nav a[aria-current="page"]')).toHaveText("CV");
  });

  for (const width of [320, 390]) {
    for (const path of [HOME, "/en/cv/"]) {
      test(`header is two tidy rows with 44px targets at ${width}px (${path})`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 });
        await page.goto(path);
        const nav = await page.$$eval("header nav a", (links) =>
          links.map((a) => {
            const r = a.getBoundingClientRect();
            return { top: Math.round(r.top), height: r.height, width: r.width };
          }),
        );
        expect(nav).toHaveLength(4);
        expect(new Set(nav.map((l) => l.top)).size, "all nav links share one row").toBe(1);
        for (const l of nav) expect(l.height).toBeGreaterThanOrEqual(44);
        for (const l of nav) expect(l.width).toBeGreaterThanOrEqual(24);
        const brand = await page.locator(".site-header__brand").boundingBox();
        expect(brand?.y).toBeLessThan(nav[0]?.top ?? 0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      });
    }
  }

  test("work CTA keeps its arrow on the same line at 1440px", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(HOME);
    const box = await page.locator(".work__cta").boundingBox();
    expect(box?.height).toBeLessThan(60);
  });

  test("reduced motion: nothing animates and everything is visible", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(HOME);
    await scrollThrough(page);
    const running = await page.evaluate(() =>
      document.getAnimations().filter((a) => a.playState === "running").length,
    );
    expect(running).toBe(0);
    expect(await page.locator(".is-pending").count()).toBe(0);
  });

  test("keyboard path: skip link, nav, primary CTA, contact", async ({ page }) => {
    await page.goto(HOME);
    await page.keyboard.press("Tab");
    await expect(page.locator(".skip-link")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main$/);

    await page.goto(HOME);
    const visited: string[] = [];
    let reachedCta = false;
    for (let i = 0; i < 25 && !reachedCta; i += 1) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        return { inNav: Boolean(el?.closest("header nav")), inHero: Boolean(el?.closest(".hero__actions")), cls: el?.className ?? "" };
      });
      if (info.inNav) visited.push("nav");
      if (info.inHero && String(info.cls).includes("btn")) reachedCta = true;
    }
    expect(visited.length).toBeGreaterThan(0);
    expect(reachedCta).toBe(true);

    // The focus ring is visible on the CTA.
    const outline = await page.evaluate(() => getComputedStyle(document.activeElement as Element).outlineStyle);
    expect(outline).not.toBe("none");

    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#contact$/);
    await expect(page.locator("#contact")).toBeInViewport();
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => Boolean(document.activeElement?.closest("#contact, .site-footer, .cv")))).toBe(true);
  });

  test("with JavaScript disabled every section and its content stays visible", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(HOME);
    for (const id of SECTION_IDS.filter((s) => s !== "hero")) {
      await expect(page.locator(`#${id} h2, #${id} h3`).first()).toBeVisible();
    }
    await expect(page.locator(".case").first()).toBeVisible();
    expect(await page.locator(".is-pending").count()).toBe(0);
    const opacities = await page.$$eval("[data-reveal]", (els) => els.map((el) => getComputedStyle(el).opacity));
    expect(new Set(opacities)).toEqual(new Set(["1"]));
    await expect(page.locator("#contact .email-link")).toBeVisible();
    // The lead case's capture is eager: no empty frame without JS.
    const lead = page.locator(".case").first().locator("img.shot__img");
    await expect(lead).toHaveAttribute("loading", "eager");
    expect(await lead.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    await context.close();
  });

  for (const [width, height] of [
    [1440, 900],
    [390, 844],
  ] as const) {
    test(`axe finds no violation at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto(HOME);
      await scrollThrough(page);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
    });

    test(`LCP element is text at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto(HOME, { waitUntil: "load" });
      const lcp = await page.evaluate(
        () =>
          new Promise<{ tag: string; inH1: boolean }>((resolve) => {
            const observer = new PerformanceObserver((list) => {
              const last = list.getEntries().at(-1) as (PerformanceEntry & { element?: Element }) | undefined;
              if (!last?.element) return;
              resolve({ tag: last.element.tagName, inH1: Boolean(last.element.closest("h1")) });
            });
            observer.observe({ type: "largest-contentful-paint", buffered: true });
            setTimeout(() => resolve({ tag: "TIMEOUT", inH1: false }), 4000);
          }),
      );
      expect(["IMG", "PICTURE", "SVG", "VIDEO", "TIMEOUT"]).not.toContain(lcp.tag);
    });
  }

  test("screenshots for visual review", async ({ page }) => {
    test.skip(!process.env["SHOTS"], "set SHOTS=1 to write full-page captures");
    for (const [name, width, height] of [
      ["desktop", 1440, 900],
      ["phone", 390, 844],
    ] as const) {
      await page.setViewportSize({ width, height });
      await page.goto(HOME);
      await scrollThrough(page);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: `test-results/home-${name}.png`, fullPage: true });
    }
  });
});

test.describe("home (EN)", () => {
  test("renders the English home, with a working switch back to French and matching hreflang", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => msg.type() === "error" && errors.push(msg.text()));
    await page.goto("/en/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Syliane Saadbouzid");
    expect(await page.locator(".case").count()).toBe(5);
    await expect(page.locator("#offres")).toContainText("Get in touch");
    await expect(page.locator("#contact")).toContainText("Write an e-mail");
    expect(await page.locator("link[rel=alternate][hreflang]").count()).toBe(3);
    // No French UI wording left in the English page chrome.
    const text = await page.locator("body").innerText();
    for (const french of ["Voir le site", "Écrire un", "Mentions légales", "Télécharger"]) expect(text).not.toContain(french);
    // Header links stay on the English pages.
    const hrefs = await page.$$eval("header nav a", (links) => links.map((a) => a.getAttribute("href")));
    expect(hrefs.every((h) => h?.startsWith("/en/"))).toBe(true);
    await page.getByRole("link", { name: "Français" }).first().click();
    await expect(page).toHaveURL(/\/fr\/$/);
    expect(errors).toEqual([]);
  });

  test("the English home has no axe violation and the legal notice exists in English", async ({ page }) => {
    await page.goto("/en/");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
    await page.goto("/en/legal-notice/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Legal notice");
  });
});
