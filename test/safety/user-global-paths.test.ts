import { symlink } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import { UnsafeUserPathError, resolveSafeUserPath, resolveUserPlatformRoots } from "../../src/utils/user-paths.js";
import { useTemporaryUserHomes } from "../support/temporary-user-home.js";

const temporaryUserHome = useTemporaryUserHomes("harnix-user-path-safety-");

describe("user-global path safety", () => {
  it("does not resolve a Kiro target through a junction or symbolic link outside the injected user home", async () => {
    const home = await temporaryUserHome();
    const external = await temporaryUserHome();
    const roots = await resolveUserPlatformRoots({ homeResolver: async () => home, environment: {} });
    await symlink(external, roots.kiro.path, process.platform === "win32" ? "junction" : "dir");

    await expect(resolveSafeUserPath(roots.kiro, "hooks/harnix-context.json")).rejects.toBeInstanceOf(UnsafeUserPathError);
  });
});
