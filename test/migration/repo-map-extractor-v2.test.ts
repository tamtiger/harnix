import { readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { queryRepoMapInternal } from "src/commands/repo-map-internal.js";
import { initializeProject } from "src/commands/init.js";
import {
  diagnoseRepoMap,
  impactRepoMap,
  impactRepoMapTests,
  refreshRepoMap,
  refsRepoMap,
} from "src/core/repo-map/service.js";
import { readInventoryFingerprint, repoMapCachePath } from "src/core/repo-map/store.js";
import { runDoctor, type DoctorDeps } from "src/core/doctor/doctor.js";
import { contextSelectionInput } from "src/core/workflow/context.js";
import type { ContextManifest } from "src/core/context/context-types.js";
import { buildTaskV3 } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { useTemporaryUserHomes } from "test/support/temporary-user-home.js";

const temporaryRepository = useTemporaryRepositories("harnix-repo-map-v2-");
const temporaryUserHome = useTemporaryUserHomes("harnix-repo-map-v2-home-");
const HINT = "run harnix repo-map --refresh";

async function projectWithExtractorOneCache(): Promise<{ root: string; fingerprint: string }> {
  const root = await temporaryRepository();
  await writeFile(join(root, "a.ts"), "export const fresh = 1;\n");
  await initializeProject({ developer: "tam", root, yes: true });
  const { map } = await refreshRepoMap({ root });
  const legacy = {
    ...map,
    extractorVersion: 1,
    records: map.records.map((record) => ({ ...record, identifiers: [...record.identifiers, "STALE_NAME"].sort() })),
  };
  await writeFile(repoMapCachePath(root), `${JSON.stringify(legacy, null, 2)}\n`);
  return { fingerprint: map.inventoryFingerprint, root };
}

function manifest(): ContextManifest {
  return { entries: [], generator: "harnix", maxCharacters: 1000, omitted: [], schemaVersion: 1, taskId: "task" };
}

describe("repo-map cache written by extractor version 1", () => {
  it("is reported invalid with a refresh hint by query, impact, tests and refs", async () => {
    const { root } = await projectWithExtractorOneCache();

    const query = await queryRepoMapInternal(root, "fresh", 5);
    const impact = await impactRepoMap({ depth: 2, limit: 5, root, target: "a.ts" });
    const tests = await impactRepoMapTests({ limit: 5, root, target: "a.ts" });
    const refs = await refsRepoMap({ limit: 5, root, symbol: "fresh" });

    expect(query).toMatchObject({ hint: HINT, results: [], status: "invalid" });
    for (const result of [impact, tests, refs]) expect(result).toMatchObject({ hint: HINT, status: "invalid" });
  });

  it("is left untouched by every read", async () => {
    const { root } = await projectWithExtractorOneCache();
    const path = repoMapCachePath(root);
    const before = { content: await readFile(path, "utf8"), mtime: (await stat(path)).mtimeMs };

    await queryRepoMapInternal(root, "fresh", 5);
    await impactRepoMap({ depth: 2, limit: 5, root, target: "a.ts" });
    await diagnoseRepoMap(root);

    expect(await readFile(path, "utf8")).toBe(before.content);
    expect((await stat(path)).mtimeMs).toBe(before.mtime);
  });

  it("is rebuilt as version 2 by refresh without reusing the old records", async () => {
    const { root } = await projectWithExtractorOneCache();
    expect(await diagnoseRepoMap(root)).toBe("stale");

    const { map } = await refreshRepoMap({ root });

    expect(map.extractorVersion).toBe(2);
    expect(map.records.find((record) => record.path === "a.ts")?.identifiers).toEqual(["fresh"]);
    expect(JSON.parse(await readFile(repoMapCachePath(root), "utf8"))).toMatchObject({ extractorVersion: 2 });
    expect(await diagnoseRepoMap(root)).toBe("ready");
  });

  it("still gives the inventory fingerprint, so a saved task context does not turn stale", async () => {
    const { fingerprint, root } = await projectWithExtractorOneCache();

    await expect(readInventoryFingerprint(root)).resolves.toBe(fingerprint);
    const input = await contextSelectionInput(root, join(root, ".harnix"), buildTaskV3(), manifest(), false);

    expect(input.inventoryFingerprint).toBe(fingerprint);
  });
});

function doctorDeps(): DoctorDeps {
  return {
    defaultCommandLookup: () => Promise.resolve(true),
    desiredPaths: () => [],
    fixGlobal: () => Promise.resolve({ platforms: [] }),
    fixProject: () => Promise.resolve(0),
    generatorVersion: "2.31.0",
    plans: { desired: () => [], memberMatchers: () => undefined },
  };
}

async function doctorOptions(root: string, fix: boolean) {
  const home = await temporaryUserHome();
  return {
    commandLookup: () => Promise.resolve(true),
    environment: {},
    fix,
    homeResolver: () => Promise.resolve(home),
    root,
  };
}

describe("doctor and a repo-map cache written by extractor version 1", () => {
  it("reports it as a stale cache (a warning) so the project stays fixable", async () => {
    const { root } = await projectWithExtractorOneCache();

    const report = await runDoctor(await doctorOptions(root, false), doctorDeps());

    expect(report.project.status).toBe("ready");
    expect(report.project.findings.filter((entry) => entry.code.startsWith("repo-map"))).toEqual([
      expect.objectContaining({ code: "repo-map-stale", fixable: true, severity: "warning" }),
    ]);
  });

  it("rebuilds version 2 with doctor --fix and then reports no repo-map finding", async () => {
    const { root } = await projectWithExtractorOneCache();

    const report = await runDoctor(await doctorOptions(root, true), doctorDeps());

    expect(JSON.parse(await readFile(repoMapCachePath(root), "utf8"))).toMatchObject({ extractorVersion: 2 });
    expect(report.project.findings.filter((entry) => entry.code.startsWith("repo-map"))).toEqual([]);
  });

  it("still reports a cache that is not a repo map at all as invalid", async () => {
    const { root } = await projectWithExtractorOneCache();
    await writeFile(repoMapCachePath(root), "{ not json");

    const report = await runDoctor(await doctorOptions(root, false), doctorDeps());

    expect(report.project.findings.map((entry) => entry.code)).toContain("repo-map-invalid");
  });
});
