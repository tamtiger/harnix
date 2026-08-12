import { readFileSync } from "node:fs";

import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [{
    name: "raw-markdown",
    enforce: "pre",
    load(id) {
      if (!id.endsWith(".md")) return undefined;
      return `export default ${JSON.stringify(readFileSync(id, "utf8"))};`;
    },
  }],
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
    globals: false,
  },
});
