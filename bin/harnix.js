#!/usr/bin/env node
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const distCli = join(dirname(fileURLToPath(import.meta.url)), "..", "dist", "cli.js");
if (!existsSync(distCli)) {
  process.stderr.write("Harnix CLI binary not found. Run 'pnpm build' first.\n");
  process.exit(1);
}

const { runEntrypoint } = await import(pathToFileURL(distCli).href);
process.exitCode = await runEntrypoint(process.argv);
