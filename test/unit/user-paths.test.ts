import { mkdir, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  UnsafeUserPathError,
  resolveSelectedUserPlatformRoots,
  resolveSafeUserPath,
  resolveUserPlatformRoots,
} from "../../src/utils/user-paths.js";
import { useTemporaryUserHomes } from "../support/temporary-user-home.js";

const temporaryUserHome = useTemporaryUserHomes();

describe("user-global paths", () => {
  it("derives all supported platform roots from an injected home without exposing it in display paths", async () => {
    const home = await temporaryUserHome();
    const roots = await resolveUserPlatformRoots({
      homeResolver: async () => home,
      environment: { CODEX_HOME: join(home, "custom-codex") },
    });

    expect(roots.kiro.path).toBe(join(home, ".kiro"));
    expect(roots.kiro.logicalPath).toBe("~/.kiro");
    expect(roots.antigravityDesktop.path).toBe(join(home, ".gemini", "config", "plugins", "harnix"));
    expect(roots.antigravityDesktop.logicalPath).toBe("~/.gemini/config/plugins/harnix");
    expect(roots.antigravityCli.path).toBe(join(home, ".gemini", "antigravity-cli", "plugins", "harnix"));
    expect(roots.codex.config.path).toBe(join(home, "custom-codex"));
    expect(roots.codex.config.logicalPath).toBe("$CODEX_HOME");
    expect(roots.codex.skills.path).toBe(join(home, ".agents"));
    expect(roots.codex.skills.logicalPath).toBe("~/.agents");
    expect(Object.values({ ...roots, codex: undefined }).every((root) => root === undefined || !root.logicalPath.includes(home))).toBe(true);
  });

  it("uses the default Codex root when CODEX_HOME is absent and renders child paths logically", async () => {
    const home = await temporaryUserHome();
    const roots = await resolveUserPlatformRoots({ homeResolver: async () => home, environment: {} });

    expect(roots.codex.config.path).toBe(join(home, ".codex"));
    expect(roots.codex.config.logicalPath).toBe("~/.codex");
    expect(roots.codex.config.display("config.toml")).toBe("~/.codex/config.toml");
  });

  it.each(["", ".", "../outside", "skills/../../outside", "/outside", "C:\\outside"]) (
    "rejects unsafe user-relative path %j",
    async (unsafePath) => {
      const home = await temporaryUserHome();
      const roots = await resolveUserPlatformRoots({ homeResolver: async () => home, environment: {} });

      await expect(resolveSafeUserPath(roots.kiro, unsafePath)).rejects.toBeInstanceOf(UnsafeUserPathError);
    },
  );

  it("rejects a user-root path that escapes through a symbolic link", async () => {
    const home = await temporaryUserHome();
    const external = await temporaryUserHome();
    const roots = await resolveUserPlatformRoots({ homeResolver: async () => home, environment: {} });
    await symlink(external, roots.kiro.path, process.platform === "win32" ? "junction" : "dir");

    await expect(resolveSafeUserPath(roots.kiro, "skills/harnix-implement/SKILL.md")).rejects.toBeInstanceOf(UnsafeUserPathError);
  });

  it("rejects a symbolic-link ancestor while deriving an Antigravity plugin root from home", async () => {
    const home = await temporaryUserHome();
    const external = await temporaryUserHome();
    await symlink(external, join(home, ".gemini"), process.platform === "win32" ? "junction" : "dir");

    await expect(resolveUserPlatformRoots({ homeResolver: async () => home, environment: {} })).rejects.toBeInstanceOf(UnsafeUserPathError);
  });

  it("rejects a filesystem root supplied through CODEX_HOME", async () => {
    const home = await temporaryUserHome();
    const filesystemRoot = process.platform === "win32" ? "C:\\" : "/";

    await expect(resolveUserPlatformRoots({ homeResolver: async () => home, environment: { CODEX_HOME: filesystemRoot } })).rejects.toBeInstanceOf(UnsafeUserPathError);
  });

  it("should_reject_a_regular_file_when_CODEX_HOME_is_selected", async () => {
    const home = await temporaryUserHome();
    const codexHome = join(home, "not-a-directory");
    await writeFile(codexHome, "not a directory\n", "utf8");

    await expect(resolveSelectedUserPlatformRoots(["codex"], {
      homeResolver: async () => home,
      environment: { CODEX_HOME: codexHome },
    })).rejects.toBeInstanceOf(UnsafeUserPathError);
  });

  it("accepts platform roots that do not exist yet but resolves writes below the verified home", async () => {
    const home = await temporaryUserHome();
    const roots = await resolveUserPlatformRoots({ homeResolver: async () => home, environment: {} });

    await expect(resolveSafeUserPath(roots.antigravityCli, "skills/harnix-check/SKILL.md")).resolves.toBe(
      join(home, ".gemini", "antigravity-cli", "plugins", "harnix", "skills", "harnix-check", "SKILL.md"),
    );
    await mkdir(join(home, ".gemini"), { recursive: true });
  });
});
