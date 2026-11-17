import { readConfig } from "src/core/config/config.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";
import { findInitializedProject, missingProjectError } from "src/utils/project-discovery.js";

/** The root of the initialized project that holds `cwd`; any other place is an error that names the way out. */
export async function initializedRoot(cwd: string): Promise<string> {
  const project = await findInitializedProject({ cwd });
  if (project.kind !== "ready") throw await missingProjectError("Repo map", cwd);
  return project.root;
}

/** The initialized project root of `cwd`, after its config has been read and validated. */
export async function configuredRoot(cwd: string): Promise<string> {
  const root = await initializedRoot(cwd);
  await readConfig(await resolveSafeHarnixPath(root, "config.yaml"));
  return root;
}
