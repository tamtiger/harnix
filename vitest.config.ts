import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Tests import `src/...` and `test/...` instead of long relative paths; mirrors tsconfig `paths`.
    alias: [
      { find: /^src\//u, replacement: fileURLToPath(new URL("./src/", import.meta.url)) },
      { find: /^test\//u, replacement: fileURLToPath(new URL("./test/", import.meta.url)) },
    ],
  },
  plugins: [
    {
      name: "raw-markdown",
      enforce: "pre",
      load(id) {
        if (!id.endsWith(".md")) return undefined;
        return `export default ${JSON.stringify(readFileSync(id, "utf8"))};`;
      },
    },
  ],
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
    globals: false,
    // Filesystem-heavy workflow tests can exceed the 5s default when the whole suite runs in parallel.
    testTimeout: 20_000,
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      reporter: ["text-summary", "json-summary"],
      // Floor = coverage measured when `standardize-tests` finished (rounded down). It only ever goes up:
      // raise it when coverage improves, never lower it to make a change pass.
      thresholds: { lines: 94.7, statements: 94.7, functions: 98.5, branches: 88.4 },
    },
  },
});
