import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

import { diagnoseProject } from "src/commands/doctor.js";
import { initializeProject } from "src/commands/init.js";
import { updateProject } from "src/commands/update.js";
import { inspectStorageLayout } from "src/core/doctor/layout-finding.js";
import type { DoctorFinding } from "src/core/doctor/findings.js";
import { resolveActiveTask, saveTask, setActiveTask } from "src/core/tasks/task.js";
import { migrateStorageLayout } from "src/core/tasks/layout-migration.js";
import { buildEpic, buildTaskV3 } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-layout-migration-");

const TASK_IDS = [
  "20260807-120000-first",
  "20260807-130000-second",
  "20260915-090000-third",
  "20261001-090000-fourth",
  "20261027-102135-fifth",
];
const EPIC_IDS = ["20260901-100000-epic-a", "20261001-100000-epic-b"];

async function legacyProject(): Promise<{ root: string; harnixRoot: string }> {
  const root = await temporaryRepository();
  await initializeProject({ developer: "tam", root, yes: true });
  const harnixRoot = join(root, ".harnix");
  for (const id of TASK_IDS) {
    const directory = join(harnixRoot, "tasks", id);
    await mkdir(join(directory, "research"), { recursive: true });
    await writeFile(join(directory, "task.json"), `${JSON.stringify(buildTaskV3({ id }), null, 2)}\n`);
    await writeFile(join(directory, "review.md"), `# ${id}\n`);
    await writeFile(join(directory, "research", "note.md"), `note of ${id}\n`);
  }
  for (const id of EPIC_IDS) {
    const directory = join(harnixRoot, "epics", id);
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, "epic.json"), `${JSON.stringify(buildEpic({ id }), null, 2)}\n`);
    await writeFile(join(directory, "spec.md"), `spec of ${id}\n`);
  }
  await setActiveTask(harnixRoot, TASK_IDS[4]!);
  return { root, harnixRoot };
}

/** Content hash per file, keyed by the path with its bucket folder removed, so layouts compare equal. */
async function contentHashes(harnixRoot: string): Promise<Map<string, string>> {
  const hashes = new Map<string, string>();
  const walk = async (directory: string): Promise<void> => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await walk(path);
      else {
        const key = relative(harnixRoot, path)
          .replaceAll("\\", "/")
          .replace(/^(tasks|epics)\/\d{4}-\d{2}\//u, "$1/");
        hashes.set(
          key,
          createHash("sha256")
            .update(await readFile(path))
            .digest("hex"),
        );
      }
    }
  };
  for (const part of ["tasks", "epics"]) await walk(join(harnixRoot, part));
  return hashes;
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

describe("storage layout migration", () => {
  it("moves flat tasks and epic folders into month buckets without touching any file content", async () => {
    const { harnixRoot } = await legacyProject();
    const before = await contentHashes(harnixRoot);

    const result = await migrateStorageLayout(harnixRoot);

    expect(result).toEqual({ tasks: 5, epics: 2, skipped: [] });
    expect(await exists(join(harnixRoot, "tasks", "2026-08", TASK_IDS[0]!, "task.json"))).toBe(true);
    expect(await exists(join(harnixRoot, "tasks", TASK_IDS[0]!))).toBe(false);
    expect(await exists(join(harnixRoot, "epics", "2026-10", EPIC_IDS[1]!, "spec.md"))).toBe(true);
    const after = await contentHashes(harnixRoot);
    expect([...after].sort()).toEqual([...before].sort());
    expect(after.size).toBe(TASK_IDS.length * 3 + EPIC_IDS.length * 2 + 1); // + the .active pointer
  });

  it("is idempotent: a second run changes nothing", async () => {
    const { harnixRoot } = await legacyProject();
    await migrateStorageLayout(harnixRoot);
    const settled = await contentHashes(harnixRoot);

    expect(await migrateStorageLayout(harnixRoot)).toEqual({ tasks: 0, epics: 0, skipped: [] });
    expect([...(await contentHashes(harnixRoot))].sort()).toEqual([...settled].sort());
  });

  it("only reports what it would move on a dry run", async () => {
    const { harnixRoot } = await legacyProject();

    expect(await migrateStorageLayout(harnixRoot, { dryRun: true })).toEqual({ tasks: 5, epics: 2, skipped: [] });

    expect(await exists(join(harnixRoot, "tasks", TASK_IDS[0]!, "task.json"))).toBe(true);
    expect(await exists(join(harnixRoot, "tasks", "2026-08"))).toBe(false);
  });

  it("never overwrites an existing destination and leaves that source where it is", async () => {
    const { harnixRoot } = await legacyProject();
    await mkdir(join(harnixRoot, "tasks", "2026-08", TASK_IDS[0]!), { recursive: true });
    await writeFile(join(harnixRoot, "tasks", "2026-08", TASK_IDS[0]!, "task.json"), "existing\n");

    const result = await migrateStorageLayout(harnixRoot);

    expect(result.tasks).toBe(4);
    expect(result.skipped).toEqual([`tasks/${TASK_IDS[0]}: destination exists`]);
    expect(await readFile(join(harnixRoot, "tasks", "2026-08", TASK_IDS[0]!, "task.json"), "utf8")).toBe("existing\n");
    expect(await exists(join(harnixRoot, "tasks", TASK_IDS[0]!, "task.json"))).toBe(true);
  });

  it("skips a folder that cannot be renamed and finishes it on the next run", async () => {
    const { harnixRoot } = await legacyProject();
    const { rename } = await import("node:fs/promises");
    const failing = (source: string, destination: string): Promise<void> =>
      source.endsWith(TASK_IDS[2]!)
        ? Promise.reject(Object.assign(new Error("locked"), { code: "EPERM" }))
        : rename(source, destination);

    const first = await migrateStorageLayout(harnixRoot, { rename: failing });

    expect(first).toEqual({ tasks: 4, epics: 2, skipped: [`tasks/${TASK_IDS[2]}: rename failed (EPERM)`] });
    expect(await exists(join(harnixRoot, "tasks", TASK_IDS[2]!, "task.json"))).toBe(true);
    expect(await migrateStorageLayout(harnixRoot)).toEqual({ tasks: 1, epics: 0, skipped: [] });
  });

  it("keeps the active pointer and the active task usable", async () => {
    const { harnixRoot } = await legacyProject();
    await saveTask(harnixRoot, buildTaskV3({ id: TASK_IDS[4]! }));
    await migrateStorageLayout(harnixRoot);

    expect((await resolveActiveTask(harnixRoot))?.id).toBe(TASK_IDS[4]);
    expect(await readFile(join(harnixRoot, "tasks", ".active"), "utf8")).toBe(`${TASK_IDS[4]}\n`);
  });
});

describe("storage layout migration through update and doctor", () => {
  async function findings(root: string): Promise<DoctorFinding[]> {
    const found: DoctorFinding[] = [];
    await inspectStorageLayout(root, found);
    return found;
  }

  it("is part of update, previewed by --dry-run, and reported by doctor until it ran", async () => {
    const { root, harnixRoot } = await legacyProject();
    expect(await findings(root)).toEqual([expect.objectContaining({ severity: "warning", fixable: true })]);

    const preview = await updateProject({ root, dryRun: true });
    expect(preview.layout).toEqual({ tasks: 5, epics: 2, skipped: [] });
    expect(await exists(join(harnixRoot, "tasks", TASK_IDS[0]!, "task.json"))).toBe(true);

    const applied = await updateProject({ root });
    expect(applied.layout).toEqual({ tasks: 5, epics: 2, skipped: [] });
    expect(await exists(join(harnixRoot, "tasks", "2026-08", TASK_IDS[0]!, "task.json"))).toBe(true);
    expect(await findings(root)).toEqual([]);
    expect((await updateProject({ root })).layout).toBeUndefined();
  });

  it("is repaired by doctor --fix", async () => {
    const { root, harnixRoot } = await legacyProject();

    const report = await diagnoseProject({ root, fix: true });

    expect(report.summary.fixed).toBeGreaterThanOrEqual(7);
    expect(await exists(join(harnixRoot, "tasks", "2026-10", TASK_IDS[3]!, "task.json"))).toBe(true);
    expect(await findings(root)).toEqual([]);
  });
});
