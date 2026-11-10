import { test, expect } from "@playwright/test";

test("segmented settings support arrows, Home and End without changing scene semantics", async ({
  page,
}) => {
  await page.goto("./?scene=1#laboratory");
  const genre = page.locator(".setting-genre");
  await genre.getByRole("button", { name: "Драма", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    genre.getByRole("button", { name: "Триллер", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("End");
  await expect(
    genre.getByRole("button", { name: "Артхаус", exact: true }),
  ).toBeFocused();
  await expect(
    genre.getByRole("button", { name: "Артхаус", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Home");
  await expect(
    genre.getByRole("button", { name: "Драма", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("a spring can reverse mid-flight and settles on the latest selected segment", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("./?scene=1#laboratory");
  const group = page.locator(".setting-genre");
  const indicator = group.locator(".segment-indicator");
  await group.getByRole("button", { name: "Триллер", exact: true }).click();
  await page.waitForTimeout(35);
  const moving = await indicator.boundingBox();
  await group.getByRole("button", { name: "Романтика", exact: true }).click();
  await page.waitForTimeout(35);
  const redirected = await indicator.boundingBox();
  expect(moving).not.toEqual(redirected);
  await group.getByRole("button", { name: "Драма", exact: true }).click();
  await expect
    .poll(async () => {
      const actual = await indicator.boundingBox();
      const expected = await group
        .getByRole("button", { name: "Драма", exact: true })
        .boundingBox();
      if (!actual || !expected) return 1000;
      return (
        Math.abs(actual.x - expected.x) +
        Math.abs(actual.y - expected.y) +
        Math.abs(actual.width - expected.width)
      );
    })
    .toBeLessThan(1.5);
  await expect(
    group.getByRole("button", { name: "Драма", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("buttons respond on pointer-down, and rapid scene changes finish on the current image", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("./?scene=1#laboratory");
  const light = page.locator(".setting-light");
  const red = light.getByRole("button", { name: "Красное", exact: true });
  await red.scrollIntoViewIfNeeded();
  const box = await red.boundingBox();
  if (!box) throw new Error("Button missing");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(red).toHaveClass(/is-pressing/);
  await expect
    .poll(() => red.evaluate((e) => Number(getComputedStyle(e).scale)))
    .toBeLessThan(1);
  await page.mouse.up();
  await expect(red).not.toHaveClass(/is-pressing/);
  const canvas = page.locator("#laboratory .lab-monitor .scene-canvas");
  await expect(canvas).toHaveAttribute("aria-busy", "false");
  await light.getByRole("button", { name: "Тёплое", exact: true }).click();
  await light.getByRole("button", { name: "Холодное", exact: true }).click();
  await expect(
    light.getByRole("button", { name: "Холодное", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(canvas).toHaveAttribute("aria-busy", "false");
  await expect(canvas.locator(".scene-previous")).toHaveCSS("opacity", "0");
  await expect(page.locator(".live-description p")).toContainText(
    "Холодный свет",
  );
});

test("reduced motion settles segments immediately and text remains usable at enlarged sizing", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./?scene=1#laboratory");
  const button = page
    .locator(".setting-genre")
    .getByRole("button", { name: "Романтика", exact: true });
  await button.click();
  const indicator = page.locator(".setting-genre .segment-indicator");
  const actual = await indicator.boundingBox();
  const target = await button.boundingBox();
  expect(Math.abs(actual!.x - target!.x)).toBeLessThan(1);
  await expect(button).toHaveCSS("scale", "1");
  await page.addStyleTag({
    content: ".lab-settings button { font-size: 18px !important; }",
  });
  await expect(button).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
