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
  },
});