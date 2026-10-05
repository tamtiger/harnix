import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { setupPlatforms } from "src/commands/setup.js";
import { CODEX_GLOBAL_HOOK_SELECTOR, codexGlobalContextHookGroup } from "src/configurators/codex.js";
import { canonicalJson } from "src/core/global/managed-json.js";
import { sha256 } from "src/utils/hashing.js";
import { compareCodeUnits } from "src/utils/order.js";
import { useTemporaryUserHomes } from "test/support/temporary-user-home.js";

const temporaryUserHome = useTemporaryUserHomes("harnix-codex-legacy-setup-");

interface Manifest {
  entries: Array<{
    path: string;
    sourceId: string;
    kind: string;
    selector?: unknown;
    generatedHash: string;
    generatorVersion: string;
  }>;
}

/** Recreates what Harnix 1.0.x left behind: the hook as a hooks.json member recorded in the sidecar, no TOML block. */
async function installLegacyCodexHook(
  home: string,
  modified: boolean,
): Promise<{ hooksPath: string; configPath: string }> {
  const environment = { CODEX_HOME: join(home, "codex") };
  await setupPlatforms({
    commandLookup: async () => true,
    environment,
    homeResolver: async () => home,
    platforms: ["codex"],
  });
  const configPath = join(home, "codex", "config.toml");
  const hooksPath = join(home, "codex", "hooks.json");
  const manifestPath = join(home, "codex", "harnix", "managed.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as Manifest;
  const hookEntry = manifest.entries.find((entry) => entry.sourceId === "codex-global-context-hook");
  if (hookEntry === undefined) throw new Error("Expected the owned Codex hook entry.");
  const original = JSON.parse(JSON.stringify(codexGlobalContextHookGroup)) as { hooks: Array<{ timeout?: number }> };
  const legacy = JSON.parse(JSON.stringify(original)) as typeof original;
  if (modified && legacy.hooks[0] !== undefined) legacy.hooks[0].timeout = 99;
  const content = { hooks: { UserPromptSubmit: [{ hooks: [{ type: "command", command: "user hook" }] }, legacy] } };
  await writeFile(configPath, "[hooks.state]\n");
  await writeFile(hooksPath, `${JSON.stringify(content, null, 2)}\n`);
  Object.assign(hookEntry, {
    kind: "json-member",
    path: "hooks.json",
    selector: CODEX_GLOBAL_HOOK_SELECTOR,
    generatedHash: sha256(canonicalJson(original)),
    generatorVersion: "1.0.6",
  });
  manifest.entries.sort((left, right) =>
    compareCodeUnits(`${left.path}\u0000${left.sourceId}`, `${right.path}\u0000${right.sourceId}`),
  );
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return { hooksPath, configPath };
}

describe("setup --codex over a Harnix 1.0.x install", () => {
  const run = (home: string) =>
    setupPlatforms({
      commandLookup: async () => true,
      environment: { CODEX_HOME: join(home, "codex") },
      homeResolver: async () => home,
      platforms: ["codex"],
    });

  it("moves an unchanged legacy hook out of hooks.json so Codex does not run it twice", async () => {
    const home = await temporaryUserHome();
    const { hooksPath, configPath } = await installLegacyCodexHook(home, false);

    const result = await run(home);

    const config = await readFile(configPath, "utf8");
    const hooks = await readFile(hooksPath, "utf8");
    expect(config).toContain("[[hooks.UserPromptSubmit]]");
    expect(config).toContain("[hooks.state]");
    expect(hooks).toContain('"command": "user hook"');
    expect(hooks).not.toContain("harnix context --platform codex");
    expect(result.platforms[0]).toMatchObject({ platform: "codex", readiness: "installed-pending-trust" });
  });

  it("keeps a legacy hook the user edited, reports drift and still installs the new one", async () => {
    const home = await temporaryUserHome();
    const { hooksPath, configPath } = await installLegacyCodexHook(home, true);

    const result = await run(home);

    await expect(readFile(hooksPath, "utf8")).resolves.toContain('"timeout": 99');
    await expect(readFile(configPath, "utf8")).resolves.toContain("[[hooks.UserPromptSubmit]]");
    expect(result.platforms[0]).toMatchObject({ platform: "codex", readiness: "drifted" });
  });

  it("is idempotent once migrated", async () => {
    const home = await temporaryUserHome();
    await installLegacyCodexHook(home, false);
    await run(home);

    const again = await run(home);

    expect(again.platforms[0]?.created).toEqual([]);
    expect(again.platforms[0]?.updated).toEqual([]);
  });
});
