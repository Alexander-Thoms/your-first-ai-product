import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: [
        "src/components/**/*.{ts,tsx}",
        "src/lib/**/*.{ts,tsx}",
        "src/ai/tools/**/*.{ts,tsx}",
      ],
      thresholds: {
        lines: 50,
        functions: 50,
        statements: 50,
      },
    },
  },
});
