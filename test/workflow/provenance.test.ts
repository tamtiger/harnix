import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { normalizeRepositoryPath, resolveSafeProjectPath } from "../../src/utils/paths.js";

const root = resolve(".");
const registryPath = "docs/HARNESS_FEATURE_PROVENANCE.json";
const expectedFeatureIds = [
  "adaptive-tdd",
  "atomic-managed-ownership",
  "conditional-research",
  "context-selection-freshness",
  "dependency-aware-repo-map",
  "deterministic-ready-trace",
  "doctor-evaluation",
  "evidence-first-debugging",
  "fresh-verification",
  "project-journal-continue",
  "repository-impact-navigation",
  "rules-guides",
  "scoped-context",
  "task-audit-readiness",
  "task-history-index",
  "task-lifecycle",
  "task-status-next-action",
  "two-stage-review",
  "untrusted-learning-promotion",
];

interface RegistrySource {
  repository: string;
  url: string;
  ref: string;
  sourceDate: string;
  license: string;
  evidenceUrls: string[];
}

interface RegistryFeature {
  id: string;
  capability: string;
  decision: "adopt" | "adapt";
  lifecycle: "implemented" | "deprecated";
  sources: RegistrySource[];
  adaptation: string;
  implementation: { code: string[]; tests: string[]; docs: string[] };
}

interface ProvenanceRegistry {
  generator: "harnix";
  schemaVersion: 1;
  reviewedAt: string;
  features: RegistryFeature[];
}

describe("external harness feature provenance", () => {
  it("keeps a complete exact-schema registry with immutable source evidence", async () => {
    const registry = JSON.parse(await readFile(resolve(root, registryPath), "utf8")) as ProvenanceRegistry;

    expect(exactKeys(registry)).toEqual(["features", "generator", "reviewedAt", "schemaVersion"]);
    expect(registry).toMatchObject({ generator: "harnix", schemaVersion: 1 });
    expect(registry.reviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/u);
    expect(registry.features.map((feature) => feature.id)).toEqual(expectedFeatureIds);

    for (const feature of registry.features) {
      expect(exactKeys(feature)).toEqual(["adaptation", "capability", "decision", "id", "implementation", "lifecycle", "sources"]);
      expect(feature.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u);
      expect(feature.capability.trim()).not.toBe("");
      expect(["adopt", "adapt"]).toContain(feature.decision);
      expect(["implemented", "deprecated"]).toContain(feature.lifecycle);
      expect(feature.adaptation.trim()).not.toBe("");
      expect(feature.sources.length).toBeGreaterThan(0);
      expect(feature.sources.map((source) => source.repository)).toEqual(sortedUnique(feature.sources.map((source) => source.repository)));

      for (const source of feature.sources) {
        expect(exactKeys(source)).toEqual(["evidenceUrls", "license", "ref", "repository", "sourceDate", "url"]);
        expect(source.repository).toMatch(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u);
        expect(source.url).toBe(`https://github.com/${source.repository}`);
        expect(source.ref).toMatch(/^[a-f0-9]{40}$/u);
        expect(source.sourceDate).toMatch(/^\d{4}-\d{2}-\d{2}$/u);
        expect(source.license.trim()).not.toBe("");
        expect(source.evidenceUrls.length).toBeGreaterThan(0);
        expect(source.evidenceUrls).toEqual(sortedUnique(source.evidenceUrls));
        for (const url of source.evidenceUrls) expect(url).toMatch(/^https:\/\//u);
      }
    }
  });

  it("maps every feature to sorted safe concrete code, test, and documentation files", async () => {
    const registry = JSON.parse(await readFile(resolve(root, registryPath), "utf8")) as ProvenanceRegistry;

    for (const feature of registry.features) {
      expect(exactKeys(feature.implementation)).toEqual(["code", "docs", "tests"]);
      for (const category of ["code", "tests", "docs"] as const) {
        const paths = feature.implementation[category];
        expect(paths.length, `${feature.id}.${category}`).toBeGreaterThan(0);
        expect(paths, `${feature.id}.${category}`).toEqual(sortedUnique(paths));
        for (const path of paths) {
          expect(path).not.toMatch(/[?*[\]{}]/u);
          expect(normalizeRepositoryPath(path)).toBe(path);
          await expect(access(await resolveSafeProjectPath(root, path)), `${feature.id}: ${path}`).resolves.toBeUndefined();
        }
      }
    }
  });
});

function exactKeys(value: object): string[] {
  return Object.keys(value).sort();
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) => left < right ? -1 : left > right ? 1 : 0);
}
