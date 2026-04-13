import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@aquapulse/types": fileURLToPath(new URL("./packages/types/src/index.ts", import.meta.url)),
      "@aquapulse/validation": fileURLToPath(new URL("./packages/validation/src/index.ts", import.meta.url)),
      "@web": fileURLToPath(new URL("./apps/web/src", import.meta.url))
    }
  },
  test: {
    include: ["apps/**/src/**/*.test.ts"],
    environment: "node"
  }
});
