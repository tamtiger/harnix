import { mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";

import type { InputDigestEntry, InputDigestSnapshot } from "./input-digest.js";
import { atomicWriteFile } from "src/utils/atomic-write.js";
import { compareCodeUnits } from "src/utils/order.js";
import { resolveSafeProjectPath } from "src/utils/paths.js";
import type { VerificationInputChange } from "./check-report.js";

function snapshotPath(harnixRoot: string, taskId: string, checkId: string): Promise<string> {
  return resolveSafeProjectPath(harnixRoot, `cache/snapshots/${taskId}/${checkId}.json`);
}

export async function saveInputDigestSnapshot(harnixRoot: string, snapshot: InputDigestSnapshot): Promise<void> {
  try {
    const path = await snapshotPath(harnixRoot, snapshot.taskId, snapshot.checkId);
    await mkdir(dirname(path), { recursive: true });
    await atomicWriteFile(path, JSON.stringify(snapshot, null, 2));
  } catch {
    // Cache write failures should never abort the verification workflow.
  }
}

export async function loadInputDigestSnapshot(
  harnixRoot: string,
  taskId: string,
  checkId: string,
): Promise<InputDigestSnapshot | undefined> {
  try {
    const path = await snapshotPath(harnixRoot, taskId, checkId);
    const text = await readFile(path, "utf8");
    return JSON.parse(text) as InputDigestSnapshot;
  } catch {
    return undefined;
  }
}

export function computeDigestChanges(
  previousEntries: readonly InputDigestEntry[] | undefined,
  currentEntries: readonly InputDigestEntry[],
): VerificationInputChange[] {
  if (!previousEntries || previousEntries.length === 0) {
    return currentEntries.slice(0, 50).map((entry) => ({ path: entry.path, kind: "changed" }));
  }

  const prevMap = new Map(previousEntries.map((e) => [e.path, e.sha256]));
  const currMap = new Map(currentEntries.map((e) => [e.path, e.sha256]));
  const changes: VerificationInputChange[] = [];

  for (const [path, prevHash] of prevMap) {
    if (!currMap.has(path)) {
      changes.push({ path, kind: "missing" });
    } else if (currMap.get(path) !== prevHash) {
      changes.push({ path, kind: "changed" });
    }
  }

  for (const path of currMap.keys()) {
    if (!prevMap.has(path)) {
      changes.push({ path, kind: "changed" });
    }
  }

  return changes.sort((a, b) => compareCodeUnits(a.path, b.path));
}
