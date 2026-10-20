import { resolve } from "node:path";

import { findInitializedProject } from "src/utils/project-discovery.js";

/**
 * The workspace root for a workspace-wide command: an explicit path, else the nearest initialized project, else the
 * current directory. Inside an initialized member that member is the root, not its parent.
 */
export async function resolveWorkspaceRoot(cwd: string, workspacePath?: string): Promise<string> {
  if (workspacePath !== undefined) return resolve(cwd, workspacePath);
  const project = await findInitializedProject({ cwd });
  return project.kind === "ready" ? project.root : cwd;
}
