import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    pool: "threads",
    globals: true,
    include: ["tests/**/*.test.ts"],
    alias: {
      "@": path.resolve(__dirname, "."),
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      thresholds: {
        lines: 40,
        functions: 40,
        statements: 40,
        branches: 30,
      },
    },
  },
});
