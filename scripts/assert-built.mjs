import { existsSync } from "node:fs";
import { join } from "node:path";

/** Fails with the step to run when the CLI the measurement drives has not been built yet. */
export function assertBuilt(root, exists = existsSync) {
  if (!exists(join(root, "dist", "cli.js")))
    throw new Error("dist/cli.js is missing; run `pnpm build` before this measurement.");
}
