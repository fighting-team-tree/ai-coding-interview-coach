import path from "node:path";

import { defineConfig, devices } from "@playwright/test";

const apiDir = path.resolve(__dirname, "../api");

export default defineConfig({
  testDir: "./test/e2e",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    ...devices["Desktop Chrome"],
    viewport: { width: 1920, height: 1080 },
    baseURL: "http://127.0.0.1:3100",
    trace: "off",
    screenshot: "off",
    video: "on",
  },
  webServer: [
    {
      command: "uv run uvicorn app.main:app --host 127.0.0.1 --port 8110",
      cwd: apiDir,
      url: "http://127.0.0.1:8110/health",
      env: {
        ...process.env,
        FRONTEND_ORIGINS: "http://localhost:3100,http://127.0.0.1:3100",
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
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
      stderr: "pipe",
      timeout: 60_000,
    },
  ],
});
