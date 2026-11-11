import { test, expect } from "@playwright/test";
import { expectHorizontalFit } from "./helpers/layout";

const chapters = ["prologue", "framing", "emotions", "lighting", "laboratory", "credits"];
const widths = [320, 360, 375, 390, 393, 414, 430, 768, 1024, 1440];

for (const width of widths) {
  test(`bounding rectangles and text lines fit at ${width}px, including expanded controls`, async ({ browser, baseURL }, info) => {
    const context = await browser.newContext({
      viewport: { width, height: width < 768 ? 844 : 1080 },
      isMobile: width < 768,
      hasTouch: true,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    page.on("response", response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    try {
      await page.goto(baseURL!);
      await page.evaluate(() => document.fonts.ready);
      // Do not let a global clip make this test pass with cropped content.
      for (const selector of ["html", "body", "main"])
        expect(await page.locator(selector).evaluate(e => getComputedStyle(e).overflowX)).toBe("visible");
      for (const id of chapters) {
        const section = page.locator(`#${id}`);
        await section.evaluate(e => e.scrollIntoView({ behavior: "instant" }));
        await expectHorizontalFit(section);
        await expectHorizontalFit(page.locator(".site-header"));
        await page.screenshot({ path: info.outputPath(`${width}-${id}.png`) });
      }

      const lighting = page.locator("#lighting");
      await lighting.evaluate(e => e.scrollIntoView({ behavior: "instant" }));
      await expect(lighting.locator(".sun-symbol")).toHaveJSProperty("tagName", "svg");
      await expect(lighting.locator(".sun-symbol")).toHaveAttribute("aria-hidden", "true");
      await expect(lighting.locator(".sun-symbol")).toHaveText("");
      await page.getByRole("button", { name: "СРАВНИТЬ СВЕТ" }).tap();
      for (const mode of ["Дневной свет", "Тёплый вечер", "Холодная ночь", "Красный свет"]) {
        await page.getByRole("group", { name: "Режим освещения" }).getByRole("button", { name: mode }).tap();
        await expectHorizontalFit(lighting);
      }
      const range = page.getByRole("slider", { name: "Положение разделителя сравнения света" });
      await range.focus();
      for (const key of ["Home", "End", "ArrowLeft"]) {
        await page.keyboard.press(key);
        await expectHorizontalFit(lighting);
      }

      const lab = page.locator("#laboratory");
      await lab.evaluate(e => e.scrollIntoView({ behavior: "instant" }));
      // Select the longest environment/shot labels and composition label.
      await page.getByRole("group", { name: "Окружение сцены" }).getByRole("button", { name: "Комната с окном", exact: true }).tap();
      await page.locator(".setting-shot").getByRole("button", { name: "Средний", exact: true }).tap();
      await page.locator(".setting-composition").getByRole("button", { name: "Отрицательное пространство", exact: true }).tap();
      await expectHorizontalFit(lab);
      await page.getByRole("group", { name: "Окружение сцены" }).getByRole("button", { name: "Ализа", exact: true }).tap();
      await expectHorizontalFit(lab);
      await page.evaluate(() => Object.defineProperty(navigator, "share", { value: undefined, configurable: true }));
      await page.getByRole("button", { name: "Поделиться", exact: true }).tap();
      await expectHorizontalFit(lab);
      await page.getByRole("button", { name: "СОЗДАТЬ СЦЕНУ", exact: true }).tap();
      await expect(page.locator(".poster-copy")).toBeVisible();
      await expectHorizontalFit(lab);
      await page.getByRole("button", { name: "Посмотреть кадр без интерфейса" }).tap();
      await expectHorizontalFit(page.locator(".frame-dialog"));
      await page.getByRole("button", { name: "Закрыть просмотр кадра" }).tap();
      await page.getByRole("button", { name: "Открыть меню" }).tap();
      await expectHorizontalFit(page.locator(".chapter-menu"));
      expect(errors).toEqual([]);
    } finally { await context.close(); }
  });
}

test("mobile composition survives breakpoint boundaries, rotation and enlarged text", async ({ page }) => {
  await page.goto("./");
  await page.evaluate(() => document.fonts.ready);
  for (const width of [540, 541, 600, 667, 767, 768, 800, 801]) {
    await page.setViewportSize({ width, height: 844 });
    for (const id of chapters) await expectHorizontalFit(page.locator(`#${id}`));
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addStyleTag({ content: "html { font-size: 125%; } #lighting .heading-aside p { font-size: 18px; }" });
  for (const id of chapters) await expectHorizontalFit(page.locator(`#${id}`));
});
