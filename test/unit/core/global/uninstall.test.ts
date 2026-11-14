import { access, lstat, mkdir, symlink } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { setupGlobal } from "src/core/global/setup.js";
import type { GlobalPlanProvider } from "src/core/global/targets.js";
import { uninstallGlobal } from "src/core/global/uninstall.js";
import { acquireHarnixFileLock } from "src/utils/file-lock.js";
import { useTemporaryUserHomes } from "test/support/temporary-user-home.js";

const temporaryUserHome = useTemporaryUserHomes("harnix-core-uninstall-");

const plans: GlobalPlanProvider = {
  desired: (planKey) =>
    planKey === "kiro"
      ? [{ path: "steering/harnix.md", sourceId: "kiro-steering", kind: "file", content: "rules\n" }]
      : [],
  memberMatchers: () => undefined,
};

async function installed() {
  const home = await temporaryUserHome();
  const common = {
    plans,
    generatorVersion: "2.0.0",
    lockAcquirer: acquireHarnixFileLock,
    homeResolver: () => Promise.resolve(home),
    environment: {},
  };
  await setupGlobal({ ...common, platforms: ["kiro"], commandLookup: () => Promise.resolve(true) });
  return { home, common };
}

describe("global uninstall lifecycle", () => {
  it("lists what it would remove and changes nothing without confirmation", async () => {
    const { home, common } = await installed();

    const result = await uninstallGlobal({ ...common, platforms: ["kiro"] });

    expect(result.platforms[0]).toMatchObject({ platform: "kiro", confirmationRequired: true, removed: [] });
    expect(result.platforms[0]?.targets).toContain("~/.kiro/steering/harnix.md");
    await expect(access(join(home, ".kiro", "steering", "harnix.md"))).resolves.toBeUndefined();
  });

  it("removes the owned files and the empty sidecar directory when confirmed", async () => {
    const { home, common } = await installed();

    const result = await uninstallGlobal({ ...common, platforms: ["kiro"], yes: true });

    expect(result.platforms[0]?.removed).toContain("~/.kiro/steering/harnix.md");
    await expect(access(join(home, ".kiro", "steering", "harnix.md"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(home, ".kiro", "harnix"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("keeps a linked directory of a relocated root when it removes the owned files below it", async () => {
    const home = await temporaryUserHome();
    const profile = join(home, "profile");
    const shared = join(home, ".claude", "skills");
    await mkdir(profile, { recursive: true });
    await mkdir(shared, { recursive: true });
    await symlink(shared, join(profile, "skills"), process.platform === "win32" ? "junction" : "dir");
    const claudePlans: GlobalPlanProvider = {
      desired: (planKey) =>
        planKey === "claude"
          ? [{ path: "skills/harnix-x/SKILL.md", sourceId: "claude-skill", kind: "file", content: "skill\n" }]
          : [],
      memberMatchers: () => undefined,
    };
    const common = {
      plans: claudePlans,
      generatorVersion: "2.0.0",
      lockAcquirer: acquireHarnixFileLock,
      homeResolver: () => Promise.resolve(home),
      environment: { CLAUDE_CONFIG_DIR: profile },
      platforms: ["claude" as const],
    };
    await setupGlobal({ ...common, commandLookup: () => Promise.resolve(true) });
    await access(join(shared, "harnix-x", "SKILL.md"));

    await uninstallGlobal({ ...common, yes: true });

    await expect(access(join(shared, "harnix-x", "SKILL.md"))).rejects.toMatchObject({ code: "ENOENT" });
    expect((await lstat(join(profile, "skills"))).isSymbolicLink()).toBe(true);
  });

  it("requires at least one platform", async () => {
    const { common } = await installed();

    await expect(uninstallGlobal({ ...common, platforms: [] })).rejects.toThrow("At least one platform");
  });
});
