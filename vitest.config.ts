import { defineConfig } from "vitest/config";

export default defineConfig({
  build: {
    dynamicImportVarsOptions: {
      exclude: [/server\/.*\.test\.mjs/],
    },
  },
  test: {
    environment: "node",
  },
});
