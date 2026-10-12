import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const [path, lang] of [
  ["/fr/cv/", "fr"],
  ["/en/cv/", "en"],
] as const) {
  test.describe(path, () => {
    test("passes axe and never exposes an address or an inert mail link", async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute("lang", lang);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
      expect(await page.content()).not.toMatch(/mailto:|[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
      await expect(page.locator(".cv-side a[aria-disabled]")).toHaveCount(0);
    });

    test("markers (if any) and fragments speak the page language", async ({ page }) => {
      await page.goto(path);
      const suffixes = await page.locator(".todo .sr-only").allInnerTexts();
      const expected = lang === "en" ? "(to confirm)" : "(à confirmer)";
      expect(await page.locator(".todo").count(), "no marker may be left on a published page").toBe(0);
      for (const text of suffixes) expect(text.trim()).toBe(expected);
      await expect(page.locator(".cv-kicker")).toContainText(lang === "en" ? "Algiers" : "Alger");
    });
  });
}
