import { describe, expect, it } from "vitest";

import { setupGlobal } from "src/core/global/setup.js";
import type { GlobalPlanProvider } from "src/core/global/targets.js";
import { updateGlobal } from "src/core/global/update.js";
import { acquireHarnixFileLock } from "src/utils/file-lock.js";
import { useTemporaryUserHomes } from "test/support/temporary-user-home.js";

const temporaryUserHome = useTemporaryUserHomes("harnix-core-update-");

const planWith = (content: string): GlobalPlanProvider => ({
  desired: (planKey) =>
    planKey === "kiro" ? [{ path: "steering/harnix.md", sourceId: "kiro-steering", kind: "file", content }] : [],
  memberMatchers: () => undefined,
});

async function context() {
  const home = await temporaryUserHome();
  return {
    generatorVersion: "2.0.0",
    lockAcquirer: acquireHarnixFileLock,
    homeResolver: () => Promise.resolve(home),
    environment: {},
    commandLookup: () => Promise.resolve(true),
  };
}

describe("global update lifecycle", () => {
  it("updates nothing when no platform carries a Harnix sidecar", async () => {
    expect(await updateGlobal({ ...(await context()), plans: planWith("v1\n") })).toEqual({
      scope: "user",
      platforms: [],
    });
  });

  it("discovers an installed platform and updates its unchanged files", async () => {
    const common = await context();
    await setupGlobal({ ...common, plans: planWith("v1\n"), platforms: ["kiro"] });

    const result = await updateGlobal({ ...common, plans: planWith("v2\n") });

    expect(result.platforms).toEqual([
      expect.objectContaining({ platform: "kiro", updated: ["~/.kiro/steering/harnix.md"] }),
    ]);
  });

  it("only touches the explicitly selected platforms", async () => {
    const common = await context();
    await setupGlobal({ ...common, plans: planWith("v1\n"), platforms: ["kiro"] });

    const result = await updateGlobal({ ...common, plans: planWith("v1\n"), platforms: ["claude"] });

    expect(result.platforms.map((platform) => platform.platform)).toEqual(["claude"]);
  });
});
