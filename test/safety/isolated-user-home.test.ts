import { delimiter, join } from "node:path";
import { describe, expect, it } from "vitest";

type IsolatedUserHomeModule = {
  createIsolatedUserEnvironment(
    home: string,
    options?: { pathPrefix?: string },
  ): NodeJS.ProcessEnv;
};

const { createIsolatedUserEnvironment } = (await import(
  new URL("../../scripts/isolated-user-home.mjs", import.meta.url).href,
)) as IsolatedUserHomeModule;

describe("isolated user-home release environment", () => {
  it("should_set_all_harnix_user_roots_when_a_disposable_home_is_provided", () => {
    const home = "C:\\temporary\\harnix-user-home";

    const environment = createIsolatedUserEnvironment(home);

    expect(environment.HOME).toBe(home);
    expect(environment.USERPROFILE).toBe(home);
    expect(environment.CODEX_HOME).toBe(join(home, ".codex"));
  });

  it("should_prefix_the_child_path_when_a_local_harnix_launcher_is_provided", () => {
    const home = "C:\\temporary\\harnix-user-home";
    const launcherDirectory = "C:\\temporary\\project\\node_modules\\.bin";

    const environment = createIsolatedUserEnvironment(home, { pathPrefix: launcherDirectory });
    const pathKey = Object.keys(environment).find((key) => key.toUpperCase() === "PATH") ?? "PATH";

    expect(environment[pathKey]).toBe(`${launcherDirectory}${delimiter}${process.env[pathKey] ?? ""}`);
  });
});
