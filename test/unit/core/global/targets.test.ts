import { describe, expect, it } from "vitest";

import { globalTargets } from "src/core/global/targets.js";
import { createVerifiedUserRoot, resolveSelectedUserPlatformRoots } from "src/core/platform/user-paths.js";
import { useTemporaryUserHomes } from "test/support/temporary-user-home.js";

const temporaryUserHome = useTemporaryUserHomes("harnix-targets-");

describe("global targets", () => {
  it("expands each selected platform into its registered sidecar targets", async () => {
    const home = await temporaryUserHome();
    const roots = await resolveSelectedUserPlatformRoots(["kiro", "antigravity", "codex"], {
      environment: {},
      homeResolver: () => Promise.resolve(home),
    });

    const targets = globalTargets(["kiro", "antigravity", "codex"], roots);

    expect(targets.map((target) => `${target.publicPlatform}/${target.globalPlatform}/${target.planKey}`)).toEqual([
      "kiro/kiro/kiro",
      "antigravity/antigravity-desktop/antigravity-plugin",
      "antigravity/antigravity-cli/antigravity-plugin",
      "codex/codex/codex-config",
      "codex/codex/codex-skills",
    ]);
    expect(targets[1]?.preserveUnownedRoot).toBe(true);
    expect(targets[3]?.root.logicalPath).toBe("~/.codex");
    expect(targets[4]?.root.logicalPath).toBe("~/.agents");
  });

  it("fails when a selected platform's root was not resolved", async () => {
    const home = await temporaryUserHome();
    const kiro = await createVerifiedUserRoot(home, "~");

    expect(() => globalTargets(["claude"], { kiro })).toThrow("The selected claude user-global root was not resolved.");
  });
});
