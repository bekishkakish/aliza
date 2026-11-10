import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import {
  defaultScene,
  describeScene,
  options,
  readScene,
  sceneURL,
} from "../src/lib/scene";

async function readyCanvas(page: Page) {
  await expect(
    page.locator("#laboratory .lab-monitor .scene-canvas"),
  ).toHaveAttribute("data-ready", "true");
  await expect(
    page.locator("#laboratory .lab-monitor .scene-canvas"),
  ).toHaveAttribute("aria-busy", "false");
}
async function canvasHash(page: Page) {
  await readyCanvas(page);
  return page
    .locator('#laboratory .lab-monitor canvas[role="img"]')
    .evaluate((c: HTMLCanvasElement) => {
      const d = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
      let h = 0;
      for (let i = 0; i < d.length; i += 41) h = (Math.imul(h, 31) + d[i]) | 0;
      return h;
    });
}
async function jump(page: Page, id: string) {
  await page
    .locator(`#${id}`)
    .evaluate((el) =>
      el.scrollIntoView({ behavior: "instant", block: "start" }),
    );
}

test("URL codec validates every setting, keeps stable round trips, and descriptions use all settings", () => {
  const state = {
    environment: 4,
    genre: 2,
    light: 3,
    shot: 2,
    mood: 0,
    composition: 2,
  };
  const url = sceneURL(state, "https://example.test/?unrelated=x");
  expect(readScene(new URL(url).search)).toEqual(state);
  expect(new URL(url).hash).toBe("#laboratory");
  expect(
    readScene(
      "?light=-1&genre=999&shot=NaN&composition=2.4&environment=<script>",
    ),
  ).toEqual(defaultScene);
  for (const key of Object.keys(options) as (keyof typeof options)[]) {
    const changed = {
      ...defaultScene,
      [key]: (defaultScene[key] + 1) % options[key].length,
    };
    expect(describeScene(changed).description).not.toBe(
      describeScene(defaultScene).description,
    );
  }
});

test("six chapters, local images, Russian metadata, no browser errors", async ({
  page,
}) => {
  const errors: string[] = [];
  const failed: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("response", (r) => {
    if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`);
  });
  await page.goto("./");
  await expect(page).toHaveTitle(
    "По ту сторону кадра — интерактивный мир кино",
  );
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page.locator("[data-chapter]")).toHaveCount(6);
  for (const section of [
    "framing",
    "emotions",
    "lighting",
    "laboratory",
    "credits",
  ]) {
    await jump(page, section);
    await page.waitForTimeout(150);
  }
  await expect(page.locator(".author-credit")).toContainText(
    "БЕЙСЕМБИНА АЛИЗА",
  );
  await page.locator("img").evaluateAll((images) =>
    Promise.all(
      images.map((image) => {
        image.loading = "eager";
        return image.decode();
      }),
    ),
  );
  const bad = await page
    .locator("img")
    .evaluateAll((images) =>
      images.filter((i) => !i.complete || !i.naturalWidth).map((i) => i.src),
    );
  expect(bad).toEqual([]);
  expect(errors).toEqual([]);
  expect(failed).toEqual([]);
});

test("navigation starts viewing, tracks chapter, traps focus, and Escape returns focus", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: "НАЧАТЬ ПРОСМОТР" }).click();
  await expect(page).toHaveURL(/#framing$/);
  await expect(page.locator(".header-chapter")).toContainText("01");
  const menu = page.getByRole("button", { name: "Открыть меню" });
  await menu.click();
  const dialog = page.getByRole("dialog", { name: "МОНТАЖНЫЙ ЛИСТ / 6 ГЛАВ" });
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 18; i++) await page.keyboard.press("Tab");
  expect(
    await page.evaluate(() => !!document.activeElement?.closest("dialog")),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(menu).toBeFocused();
  await menu.click();
  await dialog
    .getByRole("button", { name: /04.*Режиссёрская лаборатория/ })
    .click();
  await expect(page).toHaveURL(/#laboratory$/);
  await expect(page.locator(".header-chapter")).toContainText("04");
});

test("framing uses four individual photographs and an optional composition grid", async ({
  page,
}) => {
  await page.goto("./#framing");
  const sources = new Set<string>();
  for (const name of ["Общий план", "Средний план", "Крупный план", "Деталь"]) {
    await page
      .getByRole("group", { name: "Крупность кадра" })
      .getByRole("button", { name: new RegExp(name) })
      .click();
    sources.add((await page.locator(".shot-image img").getAttribute("src"))!);
    await expect(page.locator(".shot-description")).toContainText(name);
  }
  expect(sources.size).toBe(4);
  await page.getByRole("button", { name: "Сетка третей" }).click();
  await expect(page.locator(".thirds-grid")).toBeVisible();
});

test("all five emotional episodes change photograph and note", async ({
  page,
}) => {
  await page.goto("./#emotions");
  const sources = new Set<string>();
  for (const name of ["Страх", "Радость", "Одиночество", "Любовь", "Надежда"]) {
    await page
      .getByRole("group", { name: "Эмоциональные эпизоды" })
      .getByRole("button", { name: new RegExp(name) })
      .click();
    await expect(page.locator(".emotion-copy h3")).toHaveText(name);
    sources.add(
      (await page.locator(".emotion-visual img").getAttribute("src"))!,
    );
    await expect(page.locator(".emotion-visual img")).toHaveAttribute(
      "alt",
      /Ализа/,
    );
  }
  expect(sources.size).toBe(5);
});

test("lighting modes change rendered pixels; divider supports keyboard, buttons and pointer", async ({
  page,
}) => {
  await page.goto("./#lighting");
  const hashes = new Set<string>();
  for (const name of [
    "Дневной свет",
    "Тёплый вечер",
    "Холодная ночь",
    "Красный свет",
  ]) {
    await page
      .getByRole("group", { name: "Режим освещения" })
      .getByRole("button", { name })
      .click();
    await expect(page.locator(".lighting-base .scene-canvas")).toHaveAttribute(
      "aria-busy",
      "false",
    );
    hashes.add(
      await page
        .locator('.lighting-base canvas[role="img"]')
        .evaluate((c: HTMLCanvasElement) => c.toDataURL()),
    );
  }
  expect(hashes.size).toBe(4);
  await page.getByRole("button", { name: "СРАВНИТЬ СВЕТ" }).click();
  const range = page.getByRole("slider", {
    name: "Положение разделителя сравнения света",
  });
  await range.focus();
  await page.keyboard.press("ArrowRight");
  await expect(range).toHaveValue("51");
  await page.getByRole("button", { name: "Больше →" }).click();
  await expect(range).toHaveValue("61");
  await page.getByRole("button", { name: "50 / 50" }).click();
  await range.scrollIntoViewIfNeeded();
  const box = await range.boundingBox();
  if (!box) throw new Error("Missing comparison slider");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.75, box.y + box.height / 2);
  await page.mouse.up();
  expect(Number(await range.inputValue())).toBeGreaterThan(65);
});

test("touch comparison and mobile laboratory work with a phone viewport", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(new URL("#lighting", test.info().project.use.baseURL).href);
  await page.getByRole("button", { name: "СРАВНИТЬ СВЕТ" }).tap();
  const range = page.getByRole("slider", {
    name: "Положение разделителя сравнения света",
  });
  await range.scrollIntoViewIfNeeded();
  const box = await range.boundingBox();
  if (!box) throw new Error("Missing touch slider");
  await page.touchscreen.tap(box.x + box.width * 0.75, box.y + box.height / 2);
  expect(Number(await range.inputValue())).toBeGreaterThan(65);
  await page.getByRole("button", { name: "Открыть меню" }).tap();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /04.*Режиссёрская лаборатория/ })
    .tap();
  await page
    .locator(".setting-light")
    .getByRole("button", { name: "Красное", exact: true })
    .tap();
  await readyCanvas(page);
  await expect(page.locator(".lab-monitor")).toBeInViewport();
  await page.getByRole("button", { name: "СОЗДАТЬ СЦЕНУ", exact: true }).tap();
  await expect(page.locator(".poster-copy")).toBeVisible();
  await context.close();
});

test("each laboratory setting changes both actual canvas pixels and direction", async ({
  page,
}) => {
  await page.goto("./?scene=1#laboratory");
  let previous = await canvasHash(page);
  for (const [group, name] of [
    ["genre", "Триллер"],
    ["light", "Красное"],
    ["shot", "Крупный"],
    ["mood", "Напряжение"],
    ["composition", "Отрицательное пространство"],
  ] as const) {
    await page
      .locator(`.setting-${group}`)
      .getByRole("button", { name, exact: true })
      .click();
    await expect(
      page
        .locator(`.setting-${group}`)
        .getByRole("button", { name, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    const hash = await canvasHash(page);
    expect(hash).not.toBe(previous);
    previous = hash;
  }
  for (const name of [
    "Комната с окном",
    "Ночная улица",
    "За кулисами",
    "Ализа",
  ]) {
    await page
      .getByRole("group", { name: "Окружение сцены" })
      .getByRole("button", { name, exact: true })
      .click();
    const hash = await canvasHash(page);
    expect(hash).not.toBe(previous);
    previous = hash;
  }
  await expect(page.locator(".live-description p")).toContainText("Ализа");
  await expect(page.locator(".live-description p")).toContainText("Красный");
});

test("scene creation, editing, fullscreen, random and reset stay functional", async ({
  page,
}) => {
  await page.goto("./?scene=1#laboratory");
  await readyCanvas(page);
  await page
    .getByRole("button", { name: "СОЗДАТЬ СЦЕНУ", exact: true })
    .click();
  await expect(page.locator(".poster-copy")).toBeVisible();
  await expect(page.locator(".poster-copy h3")).toBeFocused();
  await page
    .getByRole("button", { name: "Посмотреть кадр без интерфейса" })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Просмотр сцены без интерфейса" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".frame-dialog")).not.toBeVisible();
  await page
    .getByRole("button", { name: "Вернуться к редактированию" })
    .click();
  await expect(page.locator(".lab-settings")).toBeVisible();
  await page.getByRole("button", { name: "Случайный вариант" }).click();
  await expect(page.getByRole("status")).toContainText("Новый вариант");
  await page.getByRole("button", { name: "Сбросить настройки" }).click();
  await expect(
    page.locator(".setting-genre button[aria-pressed=true]"),
  ).toContainText("Драма");
  await expect(
    page.locator(".setting-light button[aria-pressed=true]"),
  ).toContainText("Тёплое");
  await page
    .getByRole("button", { name: "[ ЗАМЕТКА НА ПОЛЯХ ]", exact: true })
    .click();
  await expect(page.locator(".secret-note-text")).toBeVisible();
});

test("PNG is an actual 1600×1320 image containing the current frame and poster text", async ({
  page,
}) => {
  await page.goto(
    "./?scene=1&environment=4&genre=2&light=1&shot=1&mood=2&composition=1#laboratory",
  );
  await readyCanvas(page);
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Сохранить кадр", exact: true })
    .click();
  const file = await download;
  const path = await file.path();
  if (!path) throw new Error("PNG missing");
  const bytes = await readFile(path);
  expect(bytes.subarray(1, 4).toString()).toBe("PNG");
  const meta = await sharp(bytes).metadata();
  expect(meta.width).toBe(1600);
  expect(meta.height).toBe(1320);
  const stats = await sharp(bytes)
    .extract({ left: 0, top: 900, width: 1600, height: 420 })
    .stats();
  expect(stats.channels[0].stdev).toBeGreaterThan(15);
  await file.saveAs("docs/screenshots/exported-scene.png");
});

test("share URL restores every selection and matching image after a fresh visit", async ({
  page,
  context,
}) => {
  await page.goto(
    "./?scene=1&environment=4&genre=3&light=3&shot=2&mood=0&composition=2#laboratory",
  );
  const initialHash = await canvasHash(page);
  await page.evaluate(() =>
    Object.defineProperty(navigator, "share", {
      value: undefined,
      configurable: true,
    }),
  );
  await page.getByRole("button", { name: "Поделиться", exact: true }).click();
  const url = await page
    .getByRole("textbox", { name: "Ссылка на вашу сцену" })
    .inputValue();
  const restored = await context.newPage();
  await restored.goto(url);
  expect(await canvasHash(restored)).toBe(initialHash);
  for (const [key, value] of Object.entries({
    genre: "Артхаус",
    light: "Красное",
    shot: "Крупный",
    mood: "Тревога",
    composition: "Отрицательное пространство",
  }))
    await expect(
      restored.locator(`.setting-${key} button[aria-pressed=true]`),
    ).toContainText(value);
  await expect(
    restored
      .getByRole("group", { name: "Окружение сцены" })
      .getByRole("button", { name: "Ализа", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await restored.close();
});

test("sound starts muted, responds only to explicit opt in and can be stopped", async ({
  page,
}) => {
  await page.goto("./");
  const enable = page.getByRole("button", {
    name: "Включить звук",
    exact: true,
  });
  await expect(enable).toHaveAttribute("aria-pressed", "false");
  await enable.click();
  const disable = page.getByRole("button", {
    name: "Выключить звук",
    exact: true,
  });
  await expect(disable).toHaveAttribute("aria-pressed", "true");
  await disable.click();
  await expect(enable).toHaveAttribute("aria-pressed", "false");
});

test("WCAG A/AA automated checks on page, navigation dialog and poster", async ({
  page,
}) => {
  await page.goto("./");
  const scan = () =>
    new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
  let result = await scan();
  expect(result.violations).toEqual([]);
  await page.getByRole("button", { name: "Открыть меню" }).click();
  result = await scan();
  expect(result.violations).toEqual([]);
  await page.keyboard.press("Escape");
  await jump(page, "laboratory");
  await page
    .getByRole("button", { name: "СОЗДАТЬ СЦЕНУ", exact: true })
    .click();
  result = await scan();
  expect(result.violations).toEqual([]);
});

for (const width of [320, 375, 390, 430, 768, 1024, 1440, 1920]) {
  test(`responsive ${width}px: all chapters and titles fit, laboratory controls remain usable`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1080 });
    await page.goto("./");
    for (const id of [
      "prologue",
      "framing",
      "emotions",
      "lighting",
      "laboratory",
      "credits",
    ]) {
      await jump(page, id);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `${id}: horizontal overflow`,
      ).toBe(true);
      const badText = await page
        .locator(`#${id} h1, #${id} h2, #${id} h3`)
        .evaluateAll((es) =>
          es
            .filter((e) => {
              const b = e.getBoundingClientRect();
              return (
                b.left < -1 ||
                b.right > innerWidth + 1 ||
                e.scrollWidth > e.clientWidth + 2
              );
            })
            .map((e) => e.textContent),
        );
      expect(badText).toEqual([]);
    }
    await jump(page, "laboratory");
    await page
      .locator(".setting-light")
      .getByRole("button", { name: "Красное", exact: true })
      .click();
    await readyCanvas(page);
    await expect(
      page.locator(".setting-light button[aria-pressed=true]"),
    ).toContainText("Красное");
    if (width === 390 || width === 1440) {
      for (const id of [
        "prologue",
        "framing",
        "emotions",
        "lighting",
        "laboratory",
        "credits",
      ]) {
        await jump(page, id);
        await page.waitForTimeout(200);
        await page.screenshot({ path: `docs/screenshots/${width}-${id}.png` });
      }
    }
  });
}

test("motion-enabled production view finishes entrance and chapter transition without errors", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("./");
  await expect(page.locator(".hero-buttons")).toHaveCSS("opacity", "1", {
    timeout: 10000,
  });
  await page.getByRole("button", { name: "НАЧАТЬ ПРОСМОТР" }).click();
  await expect(page).toHaveURL(/#framing$/);
  await expect(page.locator(".chapter-transition")).toHaveCSS(
    "pointer-events",
    "none",
  );
  await expect(page.locator(".header-chapter")).toContainText("01");
});

test("final credits start a fresh editable scene and replay resets the prologue", async ({
  page,
}) => {
  await page.goto("./?scene=1&light=3&genre=2#laboratory");
  await page
    .getByRole("button", { name: "СОЗДАТЬ СЦЕНУ", exact: true })
    .click();
  await page.getByRole("button", { name: "К ФИНАЛЬНЫМ ТИТРАМ" }).click();
  await page
    .getByRole("button", { name: "СОЗДАТЬ НОВУЮ СЦЕНУ", exact: true })
    .click();
  await expect(page.locator(".lab-settings")).toBeVisible();
  await expect(
    page.locator(".setting-light button[aria-pressed=true]"),
  ).toContainText("Тёплое");
  await jump(page, "prologue");
  await page.getByRole("button", { name: "02 / ЧЕЛОВЕК" }).click();
  await expect(page.locator(".hero-visual")).toHaveClass(/show-portrait/);
  await jump(page, "credits");
  await page.getByRole("button", { name: "Пройти ещё раз" }).click();
  await expect(page).toHaveURL(/#prologue$/);
  await expect(page.locator(".hero-visual")).not.toHaveClass(/show-portrait/);
});
