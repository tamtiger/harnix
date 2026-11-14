import { describe, expect, it } from "vitest";

import { inspectLinkedEntries } from "src/core/doctor/global-linked.js";
import { globalTargets } from "src/core/global/targets.js";
import { resolveUserPlatformRoots } from "src/core/platform/user-paths.js";
import { useTemporaryUserHomes } from "test/support/temporary-user-home.js";

const temporaryUserHome = useTemporaryUserHomes("harnix-linked-");

describe("linked owned entries", () => {
  it("reports nothing without a manifest", async () => {
    const home = await temporaryUserHome();
    const roots = await resolveUserPlatformRoots({ homeResolver: () => Promise.resolve(home), environment: {} });
    const [target] = globalTargets(["claude"], roots);

    await expect(inspectLinkedEntries(target!, undefined)).resolves.toEqual([]);
  });
});
