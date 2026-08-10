import { readFileSync } from "node:fs";

declare const __HARNIX_VERSION__: string | undefined;

export const packageVersion: string = typeof __HARNIX_VERSION__ === "string"
  ? __HARNIX_VERSION__
  : (JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { version: string }).version;
