import { realpath } from "node:fs/promises";

import { finding, type DoctorFinding } from "src/core/doctor/findings.js";
import { resolveSafeGlobalPath, type GlobalManagedManifestV1 } from "src/core/global/managed-files.js";
import type { GlobalTarget } from "src/core/global/targets.js";
import { isContainedPath } from "src/utils/paths.js";

/**
 * A relocated root (CLAUDE_CONFIG_DIR, CODEX_HOME, XDG_CONFIG_HOME) may reach a shared directory through a
 * junction or symlink. An owned file that really lives outside the root can be owned by a second manifest as
 * well, so removing it from one root silently breaks the other; report it instead of guessing.
 */
export async function inspectLinkedEntries(
  target: GlobalTarget,
  manifest: GlobalManagedManifestV1 | undefined,
): Promise<DoctorFinding[]> {
  if (manifest === undefined) return [];
  const realRoot = await realpathIfExists(target.root.path);
  if (realRoot === undefined) return [];
  const findings: DoctorFinding[] = [];
  for (const entry of manifest.entries) {
    if (entry.kind !== "file") continue;
    const resolved = await realpathIfExists(await resolveSafeGlobalPath(target.root, entry.path));
    if (resolved === undefined || isContainedPath(realRoot, resolved)) continue;
    findings.push(
      finding(
        "global-managed-linked-outside-root",
        "warning",
        target.root.display(entry.path),
        "A Harnix-managed global file resolves outside its platform root through a link; another root may own the same file.",
        false,
      ),
    );
  }
  return findings;
}

/** A missing, unreadable or looping link is skipped: one broken link must not turn the whole platform `invalid`. */
async function realpathIfExists(path: string): Promise<string | undefined> {
  try {
    return await realpath(path);
  } catch {
    return undefined;
  }
}
