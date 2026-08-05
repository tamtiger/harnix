import { rm } from "node:fs/promises";

await rm(new URL("../.artifacts/", import.meta.url), { force: true, recursive: true });
throw new Error("pack:check is locked as a release gate and will be implemented with packaging tests in Phase 4.");
