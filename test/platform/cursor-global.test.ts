import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { diagnoseGlobalIntegrations } from "src/commands/global-doctor.js";
import { updateGlobalPlatforms } from "src/commands/global-update.js";
import { setupPlatforms } from "src/commands/setup.js";
import { uninstallGlobalIntegrations } from "src/commands/global-uninstall.js";
import { cursorGlobalDesiredFiles } from "src/configurators/cursor.js";
import { packageVersion } from "src/version.js";
import { useTemporaryUserHomes } from "test/support/temporary-user-home.js";

const temporaryUserHome = useTemporaryUserHomes("harnix-cursor-global-home-");

const options = (home: string) =>
  ({
    commandLookup: async () => true,
    environment: {} as Record<string, string>,
    homeResolver: async () => home,
  }) as const;

const skillPath = (home: string) => join(home, ".cursor", "skills", "harnix-implement", "SKILL.md");

describe("Cursor user-global lifecycle", () => {
  it("plans only skill files, with no instruction file and no hook", () => {
    const files = cursorGlobalDesiredFiles();
    expect(files.length).toBeGreaterThan(0);
    expect(files.every((file) => file.path.startsWith("skills/") && file.kind === "file")).toBe(true);
    expect(files.some((file) => file.path === "skills/harnix-implement/SKILL.md")).toBe(true);
  });

  it("installs only skills, with no instruction file and no hooks.json", async () => {
    const home = await temporaryUserHome();

    const result = await setupPlatforms({ ...options(home), platforms: ["cursor"] });

    expect(result.scope).toBe("user");
    expect(result.platforms.map((platform) => platform.platform)).toEqual(["cursor"]);
    expect(JSON.stringify(result)).not.toContain(home);
    await expect(readFile(skillPath(home), "utf8")).resolves.toContain(`metadata:\n  version: "${packageVersion}"`);
    await expect(readFile(skillPath(home), "utf8")).resolves.toContain("harnix workflow --preflight");
    // No global instruction file (User Rules are UI-only) and no shell hook.
    await expect(access(join(home, ".cursor", "AGENTS.md"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(home, ".cursor", "CURSOR.md"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(home, ".cursor", "hooks.json"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("reports a hookless Cursor install", async () => {
    const home = await temporaryUserHome();
    const result = await setupPlatforms({ ...options(home), platforms: ["cursor"] });
    const cursor = result.platforms.find((platform) => platform.platform === "cursor");
    expect(cursor?.readiness).toBe("installed");
    expect(cursor?.warnings.join(" ")).toContain("hookless");
  });

  it("reinstalls idempotently and updates without rewriting unchanged bytes", async () => {
    const home = await temporaryUserHome();
    await setupPlatforms({ ...options(home), platforms: ["cursor"] });
    const update = await updateGlobalPlatforms({ ...options(home), platforms: ["cursor"] });
    expect(update.platforms.flatMap((platform) => platform.created)).toEqual([]);
    expect(update.platforms.flatMap((platform) => platform.updated)).toEqual([]);
  });

  it("uninstalls the owned skills", async () => {
    const home = await temporaryUserHome();
    await setupPlatforms({ ...options(home), platforms: ["cursor"] });

    await uninstallGlobalIntegrations({ ...options(home), platforms: ["cursor"], yes: true });

    await expect(access(skillPath(home))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("doctor lists Cursor after installation", async () => {
    const home = await temporaryUserHome();
    await setupPlatforms({ ...options(home), platforms: ["cursor"] });
    const integrations = await diagnoseGlobalIntegrations(options(home));
    expect(integrations.map((integration) => integration.platform)).toContain("cursor");
  });
});
