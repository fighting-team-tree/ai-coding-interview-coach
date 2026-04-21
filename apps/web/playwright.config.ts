import path from "node:path";

import { defineConfig, devices } from "@playwright/test";

const apiDir = path.resolve(__dirname, "../api");

export default defineConfig({
  testDir: "./test/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: [
    {
      command: "uv run uvicorn app.main:app --host 127.0.0.1 --port 8100",
      cwd: apiDir,
      url: "http://127.0.0.1:8100/health",
      env: {
        ...process.env,
        FRONTEND_ORIGINS:
          "http://localhost:3100,http://127.0.0.1:3100",
      },
      reuseExistingServer: false,
      stdout: "pipe",
      stderr: "pipe",
      timeout: 60_000,
    },
    {
      command: "npm run qa:serve",
      cwd: __dirname,
      url: "http://127.0.0.1:3100",
      reuseExistingServer: false,
      stdout: "pipe",
      stderr: "pipe",
      timeout: 60_000,
    },
  ],
});
