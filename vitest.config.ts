/**
 * Vitest Configuration
 * 
 * Configuration for unit and integration testing.
 * 
 * @module vitest.config
 */

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/**",
        "dist/**",
        "**/*.config.ts",
        "tests/**",
        "src/db/migrations/**",
        "src/db/seeds/**",
      ],
    },
    testTimeout: 10000,
  },
});

