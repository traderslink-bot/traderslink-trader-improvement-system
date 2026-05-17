// 2026-04-12 10:31 AM America/Toronto
// PURPOSE:
// Vitest configuration for the trader-improvement-system project.
// This enables TypeScript test execution in a jsdom environment.

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "./coverage",
    },
  },
});
