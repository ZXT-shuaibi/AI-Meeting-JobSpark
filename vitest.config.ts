/// <reference types="vitest" />
import path from "path";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    exclude: [...configDefaults.exclude, "**/.worktrees/**"],
    globals: true,
    environment: "jsdom",
    setupFiles: [],
  },
});
