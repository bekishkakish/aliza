import { test, expect } from "@playwright/test";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

async function filesIn(directory: string, prefix = ""): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const groups = await Promise.all(
    entries.map((entry) => {
      const name = prefix + entry.name;
      return entry.isDirectory()
        ? filesIn(join(directory, entry.name), name + "/")
        : [name];
    }),
  );
  return groups.flat();
}

test("Pages serves every built image, font and asset below the repository prefix", async ({
  page,
  request,
  baseURL,
}) => {
  const outside: string[] = [];
  const base = new URL(baseURL!);
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin === base.origin && !url.pathname.startsWith(base.pathname))
      outside.push(url.pathname);
  });
  await page.goto("./");
  await page.locator("img").evaluateAll((images) =>
    Promise.all(
      images.map((image) => {
        image.loading = "eager";
        return image.decode();
      }),
    ),
  );
  await page.evaluate(() => document.fonts.ready);
  expect(outside).toEqual([]);
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute(
    "href",
    "/aliza/favicon.svg",
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    "/aliza/social.jpg",
  );
  const assets = (await filesIn("dist")).filter((file) =>
    /\.(?:js|css|woff2?|webp|jpg|svg)$/.test(file),
  );
  expect(assets.some((file) => file.endsWith(".woff2"))).toBe(true);
  expect(assets.filter((file) => file.endsWith(".webp"))).toHaveLength(26);
  await Promise.all(
    assets.map(async (file) => {
      const response = await request.get(new URL(file, baseURL).href);
      expect(response.status(), file).toBe(200);
      expect((await response.body()).length, file).toBeGreaterThan(0);
    }),
  );
  expect(
    (await request.get(new URL("/media/theatre.webp", baseURL).href)).status(),
  ).toBe(404);
  expect(
    (await request.get(new URL("missing-resource.js", baseURL).href)).status(),
  ).toBe(404);
});

test("scene links, reloads and chapter navigation keep the Pages pathname", async ({
  page,
  baseURL,
}) => {
  await page.goto(
    "./?scene=1&environment=4&genre=2&light=3&shot=2&mood=0&composition=2#laboratory",
  );
  await expect(
    page.locator('.setting-light button[aria-pressed="true"]'),
  ).toHaveText("Красное");
  await page.reload();
  await expect(
    page.locator('.setting-composition button[aria-pressed="true"]'),
  ).toHaveText("Отрицательное пространство");
  await page.evaluate(() =>
    Object.defineProperty(navigator, "share", {
      value: undefined,
      configurable: true,
    }),
  );
  await page.getByRole("button", { name: "Поделиться", exact: true }).click();
  const shared = new URL(
    await page
      .getByRole("textbox", { name: "Ссылка на вашу сцену" })
      .inputValue(),
  );
  expect(shared.pathname).toBe(new URL(baseURL!).pathname);
  expect(shared.searchParams.get("environment")).toBe("4");
  expect(shared.hash).toBe("#laboratory");
  await page.getByRole("button", { name: "Открыть меню" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /01.*Искусство видеть/ })
    .click();
  expect(new URL(page.url()).pathname).toBe("/aliza/");
  expect(new URL(page.url()).hash).toBe("#framing");
});

test("Pages artifact excludes private inputs and credits contain the final author details", async ({
  page,
}) => {
  const files = await filesIn("dist");
  expect(
    files.filter((file) =>
      /(?:^|\/)(?:node_modules|\.env[^/]*|\.asset-sources|\.private|private|original-photos|reference-photos|attachments|\.codex)(?:\/|$)/.test(
        file,
      ),
    ),
  ).toEqual([]);
  expect(
    files.filter((file) =>
      /(?:Изображение ChatGPT|\.(?:pem|key|p12|pfx)$)/.test(file),
    ),
  ).toEqual([]);
  const html = await readFile("dist/index.html", "utf8");
  expect(html).not.toContain("%BASE_URL%");
  expect(html).not.toMatch(
    /(?:href|src|content)=["']\/(?:assets|media|favicon|social)/,
  );
  await page.goto("./#credits");
  await expect(page.locator(".author-credit strong")).toHaveText(
    "БЕЙСЕМБИНА АЛИЗА",
  );
  await expect(page.locator(".credit-group")).toHaveText("Группа Р-26-02");
  await expect(page.locator(".credit-roll")).not.toContainText(
    /ChatGPT|OpenAI Codex|искусственного интеллекта/,
  );
});
