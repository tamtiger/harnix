import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { atomicWriteFile } from "../../utils/atomic-write.js";
import { sha256 } from "../../utils/hashing.js";
import { normalizeRepositoryPath, resolveSafeHarnixPath } from "../../utils/paths.js";
import type { RepoMapRecordV1, RepoMapV1 } from "./types.js";
import { compareCodeUnits } from "./order.js";

export const repoMapRelativePath = "cache/repo-map-v1.json";

export function repoMapCachePath(root: string): string {
  return join(root, ".harnix", repoMapRelativePath.replaceAll("/", "\\"));
}

export async function readRepoMap(root: string): Promise<RepoMapV1> {
  const path = await resolveSafeHarnixPath(root, repoMapRelativePath);
  return validateRepoMap(JSON.parse(await readFile(path, "utf8")) as unknown);
}

export async function writeRepoMap(root: string, map: RepoMapV1): Promise<void> {
  const path = await resolveSafeHarnixPath(root, repoMapRelativePath);
  await atomicWriteFile(path, `${JSON.stringify(validateRepoMap(map), null, 2)}\n`);
}

export function createRepoMap(records: readonly RepoMapRecordV1[]): RepoMapV1 {
  const sorted = [...records].sort((left, right) => compareRepositoryPaths(left.path, right.path));
  return validateRepoMap({
    extractorVersion: 1,
    generator: "harnix",
    inventoryFingerprint: sha256(sorted.map(({ contentHash, path }) => `${path}\0${contentHash}`).join("\n")),
    records: sorted,
    schemaVersion: 1,
  });
}

export function validateRepoMap(value: unknown): RepoMapV1 {
  if (!isRecord(value) || value.generator !== "harnix" || value.schemaVersion !== 1 || value.extractorVersion !== 1 || !hash(value.inventoryFingerprint) || !Array.isArray(value.records)) throw new Error("Invalid or unsupported repo map.");
  let previous: string | undefined;
  const records = value.records.map((item) => validateRecord(item));
  for (const record of records) {
    if (previous !== undefined && compareRepositoryPaths(previous, record.path) >= 0) throw new Error("Repo map records must be unique and sorted.");
    previous = record.path;
  }
  return { extractorVersion: 1, generator: "harnix", inventoryFingerprint: value.inventoryFingerprint, records, schemaVersion: 1 };
}

function validateRecord(value: unknown): RepoMapRecordV1 {
  if (!isRecord(value) || typeof value.path !== "string" || normalizeRepositoryPath(value.path) !== value.path || !hash(value.contentHash) || !integer(value.byteLength) || typeof value.extension !== "string" || typeof value.packagePath !== "string" || (value.packagePath !== "" && normalizeRepositoryPath(value.packagePath) !== value.packagePath) || typeof value.kind !== "string" || !fileKinds.has(value.kind as RepoMapRecordV1["kind"]) || value.language !== undefined && typeof value.language !== "string") throw new Error("Invalid repo map record.");
  const headings = stringArray(value.headings, 16, 120), identifiers = stringArray(value.identifiers, 32, 96), importTargets = stringArray(value.importTargets, 32, 160);
  if ([value.path, ...headings, ...identifiers, ...importTargets].some(isSensitive)) throw new Error("Repo map record contains sensitive content.");
  return { byteLength: value.byteLength, contentHash: value.contentHash, extension: value.extension, headings, identifiers, importTargets, kind: value.kind as RepoMapRecordV1["kind"], packagePath: value.packagePath, path: value.path, ...(value.language === undefined ? {} : { language: value.language }) };
}

const fileKinds = new Set<RepoMapRecordV1["kind"]>(["source", "test", "manifest", "config", "documentation", "script", "other"]);
const sensitive = /(?:api[_-]?key|secret|token|password)\s*[=:]\s*[^\s,]{8,}/iu;
function isSensitive(value: string): boolean { return sensitive.test(value); }
function hash(value: unknown): value is string { return typeof value === "string" && /^[a-f0-9]{64}$/u.test(value); }
function integer(value: unknown): value is number { return typeof value === "number" && Number.isInteger(value) && value >= 0; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
const compareRepositoryPaths = compareCodeUnits;
function stringArray(value: unknown, count: number, length: number): string[] {
  if (!Array.isArray(value) || value.length > count || !value.every((item) => typeof item === "string" && item.length > 0 && item.length <= length)) throw new Error("Invalid repo map outline.");
  const sorted = [...value].sort(compareCodeUnits);
  if (sorted.some((item, index) => item !== value[index]) || new Set(value).size !== value.length) throw new Error("Repo map outline must be sorted and unique.");
  return value;
}
