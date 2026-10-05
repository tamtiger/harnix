import { rm } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createProgram } from "src/cli-program.js";
import type { PlatformId } from "src/core/platform/registry.js";
import { useTemporaryUserHomes } from "test/support/temporary-user-home.js";

const originalExitCode = process.exitCode;
const temporaryUserHome = useTemporaryUserHomes("harnix-exit-codes-");
const PLATFORMS: PlatformId[] = ["kiro", "antigravity", "codex", "claude", "opencode", "cursor"];

afterEach(() => {
  process.exitCode = originalExitCode;
  vi.restoreAllMocks();
});

async function run(home: string, argv: string[]): Promise<number> {
  process.exitCode = undefined;
  vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  vi.spyOn(process.stderr, "write").mockImplementation(() => true);
  await createProgram({
    commandLookup: async () => true,
    environment: { CODEX_HOME: join(home, "codex") },
    homeResolver: async () => home,
  }).parseAsync(["node", "harnix", ...argv], { from: "node" });
  const code = Number(process.exitCode ?? 0);
  process.exitCode = undefined;
  return code;
}

describe.sequential("exit codes of setup and update --global", () => {
  it.each(PLATFORMS)("a clean setup, its dry-run and an idempotent rerun all exit 0: %s", async (platform) => {
    const home = await temporaryUserHome();

    await expect(run(home, ["setup", `--${platform}`, "--dry-run"])).resolves.toBe(0);
    await expect(run(home, ["setup", `--${platform}`])).resolves.toBe(0);
    await expect(run(home, ["setup", `--${platform}`])).resolves.toBe(0);
    await expect(run(home, ["update", "--global", `--${platform}`])).resolves.toBe(0);
  });

  it("update --global reports drift with the same exit code as setup", async () => {
    const home = await temporaryUserHome();
    await run(home, ["setup", "--claude"]);
    await rm(join(home, ".claude", "skills", "harnix-plan", "SKILL.md"));

    await expect(run(home, ["update", "--global", "--claude"])).resolves.toBe(1);
    await expect(run(home, ["setup", "--claude", "--dry-run"])).resolves.toBe(0);
  });

  it("exits 1 when the Harnix launcher is missing", async () => {
    const home = await temporaryUserHome();
    process.exitCode = undefined;
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await createProgram({
      commandLookup: async () => false,
      environment: { CODEX_HOME: join(home, "codex") },
      homeResolver: async () => home,
    }).parseAsync(["node", "harnix", "setup", "--claude"], { from: "node" });

    expect(Number(process.exitCode ?? 0)).toBe(1);
  });
});
