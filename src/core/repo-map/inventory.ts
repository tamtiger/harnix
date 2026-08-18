import { lstat, readFile, realpath } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";

import { globby } from "globby";

import { normalizeRepositoryPath } from "../../utils/paths.js";
import { defaultRepoMapLimits, type RepoMapInventory, type RepoMapLimits } from "./types.js";
import { compareCodeUnits } from "../../utils/order.js";

const ignoredDirectoryNameList = [
  ".agents", ".cache", ".claude", ".codex", ".gemini", ".git", ".harnix", ".kiro", ".next", ".pytest_cache", ".trellis", ".turbo", ".understand-anything",
  "__pycache__", "bin", "build", "coverage", "dist", "node_modules", "obj", "vendor",
] as const;
const ignoredDirectoryNames = new Set<string>(ignoredDirectoryNameList);
const secretPath = /(?:^|\/)(?:\.env[^/]*|[^/]*(?:credential|secret|token)[^/]*|id_rsa[^/]*|[^/]*\.(?:pem|key))$/iu;

export async function inventoryRepository(root: string, limits: RepoMapLimits = defaultRepoMapLimits): Promise<RepoMapInventory> {
  assertRepoMapLimits(limits);
  const resolvedRoot = resolve(root);
  const realRoot = await realpath(resolvedRoot);
  const candidates = (await globby("**/*", {
    absolute: true,
    cwd: resolvedRoot,
    dot: true,
    followSymbolicLinks: false,
    gitignore: true,
    ignore: ignoredDirectoryNameList.map((name) => `**/${name}/**`),
    onlyFiles: true,
  })).sort(compareCodeUnits);
  const files: RepoMapInventory["files"] = [];
  const skipped: string[] = [];
  let totalBytes = 0;

  for (const candidate of candidates) {
    let path: string;
    try {
      path = normalizeRepositoryPath(relative(resolvedRoot, candidate));
    } catch {
      skipped.push("unsafe-path");
      continue;
    }
    if (isHardExcluded(path) || secretPath.test(path)) {
      skipped.push(path);
      continue;
    }
    try {
      const metadata = await lstat(candidate);
      if (!metadata.isFile() || metadata.isSymbolicLink()) {
        skipped.push(path);
        continue;
      }
      const realFile = await realpath(candidate);
      if (!isContained(realRoot, realFile) || metadata.size > limits.maxBytesPerFile) {
        skipped.push(path);
        continue;
      }
      if (files.length >= limits.maxFiles || totalBytes + metadata.size > limits.maxTotalBytes) {
        skipped.push("limit");
        break;
      }
      const sample = await readFile(candidate);
      if (sample.subarray(0, 8_192).includes(0)) {
        skipped.push(path);
        continue;
      }
      files.push({ absolutePath: candidate, byteLength: metadata.size, path });
      totalBytes += metadata.size;
    } catch {
      skipped.push(path);
    }
  }
  return { files, skipped: [...new Set(skipped)].sort(compareCodeUnits) };
}

function isHardExcluded(path: string): boolean {
  return path.split("/").some((segment) => ignoredDirectoryNames.has(segment));
}

function isContained(root: string, candidate: string): boolean {
  const value = relative(root, candidate);
  return value === "" || (!isAbsolute(value) && value !== ".." && !value.startsWith(`..${sep}`));
}

export function assertRepoMapLimits(limits: RepoMapLimits): void {
  for (const [name, value] of Object.entries(limits)) {
    if (!Number.isInteger(value) || value <= 0) throw new Error(`Repo map ${name} must be a positive integer.`);
  }
}
