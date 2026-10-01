import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { diagnoseGlobal, type DiagnoseGlobalDeps } from "src/core/doctor/global.js";
import type { GlobalIntegrationStatus } from "src/core/doctor/global-types.js";
import { setupGlobal } from "src/core/global/setup.js";
import { PLATFORM_IDS } from "src/core/platform/registry.js";
import { acquireHarnixFileLock } from "src/utils/file-lock.js";
import { useTemporaryUserHomes } from "test/support/temporary-user-home.js";

const temporaryUserHome = useTemporaryUserHomes("harnix-doctor-global-");

const plans = {
  desired: () => [{ path: "skills/harnix-plan/SKILL.md", sourceId: "s", kind: "file" as const, content: "v1" }],
  memberMatchers: () => undefined,
};
const deps: DiagnoseGlobalDeps = {
  plans,
  generatorVersion: "2.0.0",
  defaultCommandLookup: () => Promise.resolve(true),
};

async function context() {
  const home = await temporaryUserHome();
  return { home, homeResolver: () => Promise.resolve(home), commandLookup: () => Promise.resolve(true) };
}

const statuses = (result: Awaited<ReturnType<typeof diagnoseGlobal>>): Record<string, GlobalIntegrationStatus> =>
  Object.fromEntries(result.map((item) => [item.platform, item.status]));

describe("global diagnostics", () => {
  it("diagnoses every registered platform as not installed in an empty home", async () => {
    const { homeResolver, commandLookup } = await context();

    const result = await diagnoseGlobal({ homeResolver, commandLookup, environment: {} }, deps);

    expect(result.map((item) => item.platform)).toEqual([...PLATFORM_IDS]);
    expect(new Set(result.map((item) => item.status))).toEqual(new Set(["not-installed"]));
  });

  it("limits diagnostics to the requested platforms, in registry order", async () => {
    const { homeResolver, commandLookup } = await context();

    const result = await diagnoseGlobal(
      { homeResolver, commandLookup, environment: {}, platforms: ["claude", "kiro"] },
      deps,
    );

    expect(result.map((item) => item.platform)).toEqual(["kiro", "claude"]);
  });

  it("requires injected roots, home and command lookup in test mode", async () => {
    const { homeResolver } = await context();

    const noHome = await diagnoseGlobal({ platforms: ["kiro"] }, deps);
    expect(noHome[0]?.findings[0]?.code).toBe("test-home-required");

    const noLookup = await diagnoseGlobal({ homeResolver, platforms: ["kiro"] }, deps);
    expect(noLookup[0]?.findings[0]?.code).toBe("test-command-lookup-required");
  });

  it("reports an unresolvable home as an invalid root", async () => {
    const { commandLookup } = await context();

    const result = await diagnoseGlobal(
      { homeResolver: () => Promise.resolve("relative/home"), commandLookup, environment: {}, platforms: ["kiro"] },
      deps,
    );

    expect(result[0]).toMatchObject({
      status: "invalid",
      findings: [expect.objectContaining({ code: "global-root-invalid" })],
    });
  });

  it("reports a healthy install with the registered status per platform", async () => {
    const { homeResolver, commandLookup } = await context();
    await setupGlobal({
      platforms: ["kiro", "claude", "codex"],
      plans,
      generatorVersion: "2.0.0",
      commandLookup,
      lockAcquirer: acquireHarnixFileLock,
      homeResolver,
      environment: {},
    });

    const result = await diagnoseGlobal({ homeResolver, commandLookup, environment: {} }, deps);

    expect(statuses(result)).toMatchObject({
      kiro: "installed",
      claude: "installed",
      codex: "installed-pending-trust",
    });
  });

  it("reports an ambiguous Kiro home without retargeting the integration", async () => {
    const { home, homeResolver, commandLookup } = await context();
    await setupGlobal({
      platforms: ["kiro"],
      plans,
      generatorVersion: "2.0.0",
      commandLookup,
      lockAcquirer: acquireHarnixFileLock,
      homeResolver,
      environment: {},
    });

    const result = await diagnoseGlobal(
      { homeResolver, commandLookup, environment: { KIRO_HOME: join(home, "elsewhere") }, platforms: ["kiro"] },
      deps,
    );

    expect(result[0]?.findings).toContainEqual(
      expect.objectContaining({ code: "kiro-home-ambiguity", severity: "warning", fixable: false }),
    );
  });
});
