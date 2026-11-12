import { lstat, readFile, realpath } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";

import { globby } from "globby";

import { normalizeRepositoryPath } from "src/utils/paths.js";
import { defaultRepoMapLimits, type RepoMapInventory, type RepoMapLimits } from "./types.js";
import { IGNORED_DIRECTORY_NAMES } from "src/core/stack/ignored-directories.js";
import { loadHarnixIgnore } from "src/core/stack/harnix-ignore.js";
import { compareCodeUnits } from "src/utils/order.js";

const ignoredDirectoryNames = new Set<string>(IGNORED_DIRECTORY_NAMES);
export const secretPath =
  /(?:^|\/)(?:\.env[^/]*|id_rsa[^/]*|id_ed25519[^/]*|[^/]*\.(?:pem|key|pfx|p12)|(?:secrets?|credentials?)$|[^/]*(?:credential|secret|token)[^/]*\.(?:json|ya?ml|config|xml|ini|properties|toml|conf))$/iu;

export interface InventoryOptions {
  /**
   * A file already known to be unchanged (its size and modification time are given) skips the binary sniff that
   * reads it, so a freshness check reads only the files that may have changed.
   */
  readonly isUnchanged?: (path: string, size: number, mtimeMs: number) => boolean;
}

export async function inventoryRepository(
  root: string,
  limits: RepoMapLimits = defaultRepoMapLimits,
  options: InventoryOptions = {},
): Promise<RepoMapInventory> {
  assertRepoMapLimits(limits);
  const resolvedRoot = resolve(root);
  const realRoot = await realpath(resolvedRoot);
  const harnixIgnore = await loadHarnixIgnore(resolvedRoot);
  const candidates = (
    await globby("**/*", {
      absolute: true,
      cwd: resolvedRoot,
      dot: true,
      followSymbolicLinks: false,
      gitignore: true,
      ignore: IGNORED_DIRECTORY_NAMES.map((name) => `**/${name}/**`),
      onlyFiles: true,
    })
  ).sort(compareCodeUnits);
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
    if (isExcludedPath(path, harnixIgnore)) {
      skipped.push(path);
      continue;
    }
    try {
      const metadata = await lstat(candidate);
      if (!metadata.isFile() || metadata.isSymbolicLink()) {
        skipped.push(path);
        continue;
      }
      // A file the caller already knows is unchanged is only counted, never read, so it needs neither the
      // containment check (done when it was indexed) nor the binary sniff.
      const unchanged = options.isUnchanged?.(path, metadata.size, metadata.mtimeMs) === true;
      if (metadata.size > limits.maxBytesPerFile || (!unchanged && !isContained(realRoot, await realpath(candidate)))) {
        skipped.push(path);
        continue;
      }
      if (files.length >= limits.maxFiles || totalBytes + metadata.size > limits.maxTotalBytes) {
        skipped.push("limit");
        break;
      }
      if (!unchanged && (await looksBinary(candidate))) {
        skipped.push(path);
        continue;
      }
      files.push({ absolutePath: candidate, byteLength: metadata.size, mtimeMs: metadata.mtimeMs, path });
      totalBytes += metadata.size;
    } catch {
      skipped.push(path);
    }
  }
  return { files, skipped: [...new Set(skipped)].sort(compareCodeUnits) };
}

function isExcludedPath(path: string, harnixIgnore: { ignores(path: string): boolean }): boolean {
  return (
    path === ".harnixignore" ||
    path.endsWith("/.harnixignore") ||
    isHardExcluded(path) ||
    secretPath.test(path) ||
    harnixIgnore.ignores(path)
  );
}

async function looksBinary(file: string): Promise<boolean> {
  return (await readFile(file)).subarray(0, 8_192).includes(0);
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
