import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

import { useTemporaryRepositories } from "test/support/temporary-repository.js";

type Assertions = {
  assertExpectedGlobalSurfaces(home: string): Promise<void>;
  assertSetupExitContract(result: { status: number; stderr: string; stdout: string }): void;
};

const { assertExpectedGlobalSurfaces, assertSetupExitContract } = (await import(
  new URL("../../scripts/scan-release-assertions.mjs", import.meta.url).href
)) as Assertions;
const temporaryRoot = useTemporaryRepositories("harnix-release-platforms-");

const result = (platforms: Array<{ platform: string; readiness: string; warnings?: string[] }>) =>
  JSON.stringify({ scope: "user", platforms: platforms.map((entry) => ({ warnings: [], ...entry })) });

describe("assertSetupExitContract", () => {
  it("expects exit 0 when every platform has its own healthy readiness, notices included", () => {
    const stdout = result([
      { platform: "codex", readiness: "installed-pending-trust" },
      { platform: "antigravity", readiness: "precedence-unknown" },
      { platform: "opencode", readiness: "installed", warnings: ["a fixed informational notice"] },
      { platform: "cursor", readiness: "installed" },
    ]);

    expect(() => assertSetupExitContract({ status: 0, stderr: "opencode: a notice\n", stdout })).not.toThrow();
    expect(() => assertSetupExitContract({ status: 1, stderr: "x\n", stdout })).toThrow(/expected 0/u);
  });

  it("expects exit 1 with guidance when a platform is not healthy", () => {
    const stdout = result([{ platform: "claude", readiness: "drifted", warnings: ["claude: preserved a file"] }]);

    expect(() => assertSetupExitContract({ status: 1, stderr: "claude: preserved a file\n", stdout })).not.toThrow();
    expect(() => assertSetupExitContract({ status: 0, stderr: "", stdout })).toThrow(/expected 1/u);
    expect(() => assertSetupExitContract({ status: 1, stderr: "", stdout })).toThrow(/stderr/u);
  });
});

describe("assertExpectedGlobalSurfaces", () => {
  const surfaces = [
    ".agents/harnix/managed.json",
    ".agents/skills",
    ".codex/AGENTS.md",
    ".codex/harnix/managed.json",
    ".codex/config.toml",
    ".gemini/antigravity-cli/plugins/harnix/.managed.json",
    ".gemini/antigravity-cli/plugins/harnix/hooks.json",
    ".gemini/antigravity-cli/plugins/harnix/plugin.json",
    ".gemini/config/plugins/harnix/.managed.json",
    ".gemini/config/plugins/harnix/hooks.json",
    ".gemini/config/plugins/harnix/plugin.json",
    ".kiro/harnix/managed.json",
    ".kiro/hooks/harnix-context.json",
    ".kiro/steering/harnix.md",
    ".claude/harnix/managed.json",
    ".claude/CLAUDE.md",
    ".claude/settings.json",
    ".claude/skills",
    ".config/opencode/harnix/managed.json",
    ".config/opencode/AGENTS.md",
    ".config/opencode/skills",
    ".cursor/harnix/managed.json",
    ".cursor/skills",
  ];

  async function homeWith(paths: readonly string[]): Promise<string> {
    const home = await temporaryRoot();
    for (const relativePath of paths) {
      const target = join(home, ...relativePath.split("/"));
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, "x").catch(() => undefined);
    }
    return home;
  }

  it("accepts a home that has the surfaces of all six platforms", async () => {
    await expect(assertExpectedGlobalSurfaces(await homeWith(surfaces))).resolves.toBeUndefined();
  });

  it.each([".claude/settings.json", ".config/opencode/AGENTS.md", ".cursor/skills"])(
    "reports a missing surface: %s",
    async (missing) => {
      const home = await homeWith(surfaces.filter((path) => path !== missing));

      await expect(assertExpectedGlobalSurfaces(home)).rejects.toThrow(missing);
    },
  );
});
