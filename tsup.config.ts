import { defineConfig } from "tsup";
import { readFileSync } from "node:fs";

const packageVersion = (JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as { version: string }).version;

export default defineConfig({
  entry: ["src/index.ts", "src/cli.ts"],
  format: ["esm"],
  target: "node18",
  clean: true,
  dts: true,
  sourcemap: true,
  splitting: true,
  define: { __HARNIX_VERSION__: JSON.stringify(packageVersion) },
});
