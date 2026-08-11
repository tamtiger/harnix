import { delimiter, join } from "node:path";

/**
 * Produces a child-process environment whose user-profile surfaces are all
 * contained in a disposable directory. Release scripts must use this for any
 * command that can invoke Harnix's user-global lifecycle.
 */
export function createIsolatedUserEnvironment(home, options = {}) {
  const environment = {
    ...process.env,
    CODEX_HOME: join(home, ".codex"),
    HOME: home,
    USERPROFILE: home,
  };
  if (options.pathPrefix === undefined) return environment;

  const pathKey = Object.keys(environment).find((key) => key.toUpperCase() === "PATH") ?? "PATH";
  const inheritedPath = environment[pathKey] ?? "";
  environment[pathKey] = inheritedPath.length === 0
    ? options.pathPrefix
    : `${options.pathPrefix}${delimiter}${inheritedPath}`;
  return environment;
}
