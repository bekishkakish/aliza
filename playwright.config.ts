import { defineConfig } from "@playwright/test";
const port = process.env.PAGES_PREVIEW_PORT || "5174";
const baseURL = `http://127.0.0.1:${port}/aliza/`;
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  expect: { timeout: 7000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    browserName: process.env.PLAYWRIGHT_BROWSER === "webkit" ? "webkit" : "chromium",
    channel: process.env.PLAYWRIGHT_BROWSER === "webkit" ? undefined : process.env.PLAYWRIGHT_CHANNEL || "msedge",
    viewport: { width: 1440, height: 960 },
    reducedMotion: "reduce",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run preview:pages",
    url: baseURL,
    reuseExistingServer: false,
  },
});
