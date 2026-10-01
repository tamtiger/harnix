import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import type { DoctorFinding } from "src/core/doctor/findings.js";
import { inspectUntrackedLegacySurfaces, readOptionalSafe } from "src/core/doctor/project-legacy.js";
import type { ManagedManifest } from "src/core/managed/project-files.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-doctor-legacy-");
const emptyManifest: ManagedManifest = { generator: "harnix", schemaVersion: 1, entries: [] };

describe("legacy project surface diagnostics", () => {
  it("reads a missing file as empty and an existing one as its text", async () => {
    const root = await temporaryRepository();
    await writeFile(join(root, "a.md"), "text");
    const findings: DoctorFinding[] = [];

    expect(await readOptionalSafe(root, "a.md", findings)).toBe("text");
    expect(await readOptionalSafe(root, "missing.md", findings)).toBe("");
    expect(findings).toEqual([]);
  });

  it("reports an unsafe path instead of reading outside the project", async () => {
    const root = await temporaryRepository();
    const findings: DoctorFinding[] = [];

    expect(await readOptionalSafe(root, "../escape.md", findings)).toBe("");
    expect(findings[0]).toMatchObject({ code: "unsafe-path", severity: "error" });
  });

  it("flags an untracked legacy Kiro steering file that mentions Harnix", async () => {
    const root = await temporaryRepository();
    await mkdir(join(root, ".kiro", "steering"), { recursive: true });
    await writeFile(join(root, ".kiro", "steering", "harnix.md"), "# harnix steering\n");
    const findings: DoctorFinding[] = [];

    await inspectUntrackedLegacySurfaces(root, emptyManifest, findings);

    expect(findings).toContainEqual(
      expect.objectContaining({ code: "legacy-project-surface-untracked", path: ".kiro/steering/harnix.md" }),
    );
  });

  it("flags an untracked legacy hook that would run next to the global integration", async () => {
    const root = await temporaryRepository();
    await mkdir(join(root, ".codex"), { recursive: true });
    await writeFile(join(root, ".codex", "hooks.json"), '{"command":"harnix internal context"}\n');
    const findings: DoctorFinding[] = [];

    await inspectUntrackedLegacySurfaces(root, emptyManifest, findings);

    expect(findings).toContainEqual(
      expect.objectContaining({ code: "legacy-project-duplicate-hook", path: ".codex/hooks.json" }),
    );
  });

  it("ignores a file that does not look like a Harnix surface", async () => {
    const root = await temporaryRepository();
    await writeFile(join(root, "AGENTS.md"), "# my own agent notes\n");
    const findings: DoctorFinding[] = [];

    await inspectUntrackedLegacySurfaces(root, emptyManifest, findings);

    expect(findings).toEqual([]);
  });
});
