import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { setupGlobal, type SetupGlobalOptions } from "src/core/global/setup.js";
import type { GlobalPlanProvider } from "src/core/global/targets.js";
import { acquireHarnixFileLock } from "src/utils/file-lock.js";
import { useTemporaryUserHomes } from "test/support/temporary-user-home.js";

const temporaryUserHome = useTemporaryUserHomes("harnix-core-setup-");

const plans: GlobalPlanProvider = {
  desired: (planKey) =>
    planKey === "kiro"
      ? [{ path: "steering/harnix.md", sourceId: "kiro-steering", kind: "file", content: "rules\n" }]
      : [],
  memberMatchers: () => undefined,
};

async function options(overrides: Partial<SetupGlobalOptions> = {}): Promise<SetupGlobalOptions> {
  const home = await temporaryUserHome();
  return {
    platforms: ["kiro"],
    plans,
    generatorVersion: "2.0.0",
    commandLookup: () => Promise.resolve(true),
    lockAcquirer: acquireHarnixFileLock,
    homeResolver: () => Promise.resolve(home),
    environment: {},
    ...overrides,
  };
}

describe("global setup lifecycle", () => {
  it("installs the planned files and reports the registered readiness", async () => {
    const setup = await options();
    const result = await setupGlobal(setup);
    const home = await setup.homeResolver!();

    expect(result.platforms).toEqual([
      expect.objectContaining({ platform: "kiro", readiness: "installed", created: ["~/.kiro/steering/harnix.md"] }),
    ]);
    expect(await readFile(join(home, ".kiro", "steering", "harnix.md"), "utf8")).toBe("rules\n");
  });

  it("writes nothing on a dry run", async () => {
    const setup = await options({ dryRun: true });
    const result = await setupGlobal(setup);
    const home = await setup.homeResolver!();

    expect(result.platforms[0]?.created).toEqual(["~/.kiro/steering/harnix.md"]);
    await expect(access(join(home, ".kiro"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("reports a missing launcher and adds the platform notice only when the launcher exists", async () => {
    const missing = await setupGlobal(await options({ commandLookup: () => Promise.resolve(false) }));
    expect(missing.platforms[0]?.readiness).toBe("binary-unavailable");
    expect(missing.platforms[0]?.warnings.join("\n")).toContain("not found on PATH");

    const codex = await setupGlobal(await options({ platforms: ["codex"] }));
    expect(codex.platforms[0]?.readiness).toBe("installed-pending-trust");
    expect(codex.platforms[0]?.warnings.join("\n")).toContain("/hooks");
  });

  it("requires at least one platform", async () => {
    await expect(setupGlobal(await options({ platforms: [] }))).rejects.toThrow("At least one platform");
  });
});
