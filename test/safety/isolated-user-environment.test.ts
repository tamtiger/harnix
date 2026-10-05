import { isAbsolute, join, relative } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

type Isolated = { createIsolatedUserEnvironment(home: string): NodeJS.ProcessEnv };

const { createIsolatedUserEnvironment } = (await import(
  new URL("../../scripts/isolated-user-home.mjs", import.meta.url).href
)) as Isolated;

const home = join(process.cwd(), "disposable-home");
const insideHome = (path: string | undefined): boolean =>
  path !== undefined && isAbsolute(path) && !relative(home, path).startsWith("..");

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isolated user environment keeps every Harnix root inside the disposable home", () => {
  it("overrides each variable that can relocate a platform root, even when the developer's shell sets it", () => {
    for (const name of ["CODEX_HOME", "CLAUDE_CONFIG_DIR", "XDG_CONFIG_HOME", "APPDATA", "LOCALAPPDATA"]) {
      vi.stubEnv(name, join(process.cwd(), "real-profile", name));
    }
    vi.stubEnv("KIRO_HOME", join(process.cwd(), "real-profile", "kiro"));

    const environment = createIsolatedUserEnvironment(home);

    expect(environment.CODEX_HOME).toBe(join(home, ".codex"));
    expect(environment.CLAUDE_CONFIG_DIR).toBe(join(home, ".claude"));
    expect(environment.XDG_CONFIG_HOME).toBe(join(home, ".config"));
    for (const name of ["HOME", "USERPROFILE", "APPDATA", "LOCALAPPDATA"]) {
      expect(insideHome(environment[name]), name).toBe(true);
    }
    expect(environment.KIRO_HOME).toBeUndefined();
  });

  it("keeps unrelated variables of the parent environment", () => {
    vi.stubEnv("HARNIX_ISOLATION_PROBE", "kept");

    expect(createIsolatedUserEnvironment(home).HARNIX_ISOLATION_PROBE).toBe("kept");
  });
});
