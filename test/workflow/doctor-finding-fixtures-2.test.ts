import { appendFile, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { initializeProject } from "src/commands/init.js";
import { inspectUntrackedLegacySurfaces } from "src/core/doctor/project-legacy.js";
import { diagnoseProjectSection } from "src/core/doctor/project.js";
import type { DoctorFinding } from "src/core/doctor/findings.js";
import { readManifest, writeManifest, type ManagedEntry } from "src/core/managed/project-files.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-doctor-fixtures2-");
const noDesiredFiles = () => [] as string[];
const hash = "b".repeat(64);

async function initialized(): Promise<string> {
  const root = await temporaryRepository();
  await initializeProject({ developer: "tam", root, yes: true });
  return root;
}

async function diagnose(root: string, platform?: NodeJS.Platform): Promise<string[]> {
  const original = process.platform;
  if (platform !== undefined) Object.defineProperty(process, "platform", { value: platform });
  try {
    return (await diagnoseProjectSection(root, noDesiredFiles)).findings.map((item) => item.code);
  } finally {
    Object.defineProperty(process, "platform", { value: original });
  }
}

async function replaceManifest(root: string, entries: ManagedEntry[]): Promise<void> {
  await writeManifest(join(root, ".harnix", ".template-hashes.json"), {
    generator: "harnix",
    schemaVersion: 1,
    entries,
  });
}

function entry(path: string, scope: ManagedEntry["scope"]): ManagedEntry {
  return { path, sourceId: "fixture", scope, generatedHash: hash, generatorVersion: "0.0.0" };
}

describe("project manifest fixtures", () => {
  it('produces "manifest-invalid" for a corrupt manifest', async () => {
    const root = await initialized();
    await writeFile(join(root, ".harnix", ".template-hashes.json"), "{ not a manifest");

    expect(await diagnose(root)).toContain("manifest-invalid");
  });

  it('produces "managed-modified" for an owned file the user edited', async () => {
    const root = await initialized();
    const owned = (await readManifest(join(root, ".harnix", ".template-hashes.json"))).entries.find(
      (item) => item.scope === "project",
    );
    expect(owned).toBeDefined();
    await appendFile(join(root, owned?.path ?? ""), "\nuser change\n");

    expect(await diagnose(root)).toContain("managed-modified");
  });

  it('produces "unsafe-managed-path" when an owned path cannot be read as a file', async () => {
    const root = await initialized();
    await mkdir(join(root, "owned-directory"), { recursive: true });
    await replaceManifest(root, [entry("owned-directory", "project")]);

    expect(await diagnose(root)).toContain("unsafe-managed-path");
  });

  it('produces "repo-map-invalid" for a corrupt repository map cache', async () => {
    const root = await initialized();
    await mkdir(join(root, ".harnix", "cache"), { recursive: true });
    await writeFile(join(root, ".harnix", "cache", "repo-map-v1.json"), "{ not json");

    expect(await diagnose(root)).toContain("repo-map-invalid");
  });
});

describe("project permission fixtures (POSIX branch exercised by overriding the platform)", () => {
  it('produces "broad-permissions" for a managed file the platform reports as world-writable', async () => {
    const root = await initialized();
    await writeFile(join(root, "world-writable.md"), "text");
    await replaceManifest(root, [entry("world-writable.md", "project")]);

    expect(await diagnose(root, "linux")).toContain("broad-permissions");
  });
});

describe("legacy surface fixtures", () => {
  it('produces "legacy-project-surface-missing" for a proven surface that was deleted', async () => {
    const root = await initialized();
    await replaceManifest(root, [entry(".kiro/steering/harnix.md", "kiro")]);

    expect(await diagnose(root)).toContain("legacy-project-surface-missing");
  });

  it('produces "legacy-project-surface-modified" for a proven surface that changed', async () => {
    const root = await initialized();
    await mkdir(join(root, ".kiro", "steering"), { recursive: true });
    await writeFile(join(root, ".kiro", "steering", "harnix.md"), "edited by the user");
    await replaceManifest(root, [entry(".kiro/steering/harnix.md", "kiro")]);

    expect(await diagnose(root)).toContain("legacy-project-surface-modified");
  });

  it('produces "legacy-project-surface-unsafe" when a proven surface cannot be read as a file', async () => {
    const root = await initialized();
    await mkdir(join(root, ".kiro", "steering", "harnix.md"), { recursive: true });
    await replaceManifest(root, [entry(".kiro/steering/harnix.md", "kiro")]);

    expect(await diagnose(root)).toContain("legacy-project-surface-unsafe");
  });

  it('produces "legacy-surface-inspection-failed" when a legacy skill root is a file', async () => {
    const root = await initialized();
    await rm(join(root, ".kiro", "skills"), { force: true, recursive: true });
    await mkdir(join(root, ".kiro"), { recursive: true });
    await writeFile(join(root, ".kiro", "skills"), "not a directory");
    const findings: DoctorFinding[] = [];

    await inspectUntrackedLegacySurfaces(root, { generator: "harnix", schemaVersion: 1, entries: [] }, findings);

    expect(findings.map((item) => item.code)).toContain("legacy-surface-inspection-failed");
  });
});
