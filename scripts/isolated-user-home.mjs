import { delimiter, join } from "node:path";

/**
 * Produces a child-process environment whose user-profile surfaces are all
 * contained in a disposable directory. Release scripts must use this for any
 * command that can invoke Harnix's user-global lifecycle.
 *
 * Every variable that can relocate a platform root is pinned inside the
 * disposable home, so a developer shell that exports one of them (a real
 * CLAUDE_CONFIG_DIR, CODEX_HOME, XDG_CONFIG_HOME...) can never be written to.
 */
export function createIsolatedUserEnvironment(home, options = {}) {
  const environment = {
    ...process.env,
    APPDATA: join(home, "AppData", "Roaming"),
    CLAUDE_CONFIG_DIR: join(home, ".claude"),
    CODEX_HOME: join(home, ".codex"),
    HOME: home,
    LOCALAPPDATA: join(home, "AppData", "Local"),
    USERPROFILE: home,
    XDG_CONFIG_HOME: join(home, ".config"),
  };
  // KIRO_HOME only triggers a diagnostic about an unsupported relocation; a real value must not leak in.
  delete environment.KIRO_HOME;
  if (options.pathPrefix === undefined) return environment;

  const pathKey = Object.keys(environment).find((key) => key.toUpperCase() === "PATH") ?? "PATH";
  const inheritedPath = environment[pathKey] ?? "";
  environment[pathKey] =
    inheritedPath.length === 0 ? options.pathPrefix : `${options.pathPrefix}${delimiter}${inheritedPath}`;
  return environment;
}
