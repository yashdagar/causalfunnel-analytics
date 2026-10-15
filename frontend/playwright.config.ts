import { defineConfig, devices } from "@playwright/test";

const API_PORT = 4100;
const WEB_PORT = 3100;

export const API_ORIGIN = `http://localhost:${API_PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
    viewport: { width: 1440, height: 900 },
  },
  webServer: [
    {
      command: "npx tsx src/devMemory.ts",
      cwd: "../backend",
      url: `${API_ORIGIN}/api/health`,
      env: { PORT: String(API_PORT) },
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `npx next dev --port ${WEB_PORT}`,
      url: `http://localhost:${WEB_PORT}/sessions`,
      env: { API_URL: API_ORIGIN },
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
