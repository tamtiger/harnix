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
    pool: "forks",
    // Suites of filesystem and process tests slow down when every core runs one (a file took 4 to 13 times longer in
    // the suite than alone). Three full runs each on 12 cores: 6 workers 80/77/77 s, 12 workers 83/81/98 s, 8 workers
    // 73/91/111 s; 6 is the fastest on average and the steadiest.
    maxWorkers: 6,
    // Files share each worker's module graph instead of importing it again per file (about a third of the wall time).
    // Tests restore process.cwd, process.exitCode and their spies in afterEach and never mock a whole module (an
    // afterEach cannot undo vi.mock; test-structure enforces it), so sharing modules stays safe.
    isolate: false,
    // Resets every spy before each test, so a spy a test forgets to restore cannot leak into the next file of a worker.
    restoreMocks: true,
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
      thresholds: { lines: 96, statements: 96, functions: 98.8, branches: 90.5 },
    },
  },
});
