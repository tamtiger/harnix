import { symlink } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { UnsafeUserPathError, resolveSafeUserPath, resolveUserPlatformRoots } from "src/core/platform/user-paths.js";
import { useTemporaryUserHomes } from "test/support/temporary-user-home.js";

const temporaryUserHome = useTemporaryUserHomes("harnix-user-path-safety-");

describe("user-global path safety", () => {
  it("does not resolve a Kiro target through a junction or symbolic link outside the injected user home", async () => {
    const home = await temporaryUserHome();
    const external = await temporaryUserHome();
    const roots = await resolveUserPlatformRoots({ homeResolver: async () => home, environment: {} });
    await symlink(external, roots.kiro.path, process.platform === "win32" ? "junction" : "dir");

    await expect(resolveSafeUserPath(roots.kiro, "hooks/harnix-context.json")).rejects.toBeInstanceOf(
      UnsafeUserPathError,
    );
  });

  describe("OpenCode root and XDG_CONFIG_HOME", () => {
    it("uses ~/.config/opencode when the variable is unset, empty or not an absolute path", async () => {
      const home = await temporaryUserHome();

      for (const value of [undefined, "", "   ", "relative/dir"]) {
        const roots = await resolveUserPlatformRoots({
          homeResolver: async () => home,
          environment: value === undefined ? {} : { XDG_CONFIG_HOME: value },
        });

        expect(roots.opencode.logicalPath).toBe("~/.config/opencode");
        expect(roots.opencode.path).toBe(join(home, ".config", "opencode"));
      }
    });

    it("follows an absolute XDG_CONFIG_HOME, as OpenCode does, and still contains every target", async () => {
      const home = await temporaryUserHome();
      const xdg = await temporaryUserHome();

      const roots = await resolveUserPlatformRoots({
        homeResolver: async () => home,
        environment: { XDG_CONFIG_HOME: xdg },
      });

      expect(roots.opencode.path).toBe(join(xdg, "opencode"));
      expect(roots.opencode.logicalPath).toBe("$XDG_CONFIG_HOME/opencode");
      expect(roots.opencode.display("AGENTS.md")).toBe("$XDG_CONFIG_HOME/opencode/AGENTS.md");
      await expect(resolveSafeUserPath(roots.opencode, "../escape")).rejects.toBeInstanceOf(UnsafeUserPathError);
    });

    it("does not let XDG_CONFIG_HOME move any other platform", async () => {
      const home = await temporaryUserHome();
      const xdg = await temporaryUserHome();

      const roots = await resolveUserPlatformRoots({
        homeResolver: async () => home,
        environment: { XDG_CONFIG_HOME: xdg },
      });

      expect(roots.cursor.path).toBe(join(home, ".cursor"));
      expect(roots.claude.path).toBe(join(home, ".claude"));
    });
  });
});
