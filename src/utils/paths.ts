import { execFile } from "node:child_process";
import { realpath } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep, win32 } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export class UnsafeProjectPathError extends Error {
  override name = "UnsafeProjectPathError";
}

export type GitRootLookup = (cwd: string) => Promise<string | undefined>;

export interface NormalizeRepositoryPathOptions {
  allowRoot?: boolean;
}

export function normalizeRepositoryPath(
  value: string,
  options: NormalizeRepositoryPathOptions = {},
): string {
  if (value.length === 0 || isAbsolute(value) || win32.isAbsolute(value)) {
    throw new UnsafeProjectPathError("A repository path must be non-empty and relative.");
  }

  const normalized = value.replaceAll("\\", "/").replace(/\/+/gu, "/");
  const resolved = normalized.split("/").reduce<string[]>((segments, segment) => {
    if (segment === "" || segment === ".") {
      return segments;
    }
    if (segment === "..") {
      segments.pop();
      return segments;
    }
    segments.push(segment);
    return segments;
  }, []);

  const containsTraversal = normalized.split("/").some((segment) => segment === "..");
  if (containsTraversal || resolved.length === 0) {
    if (options.allowRoot && normalized === ".") {
      return ".";
    }
    throw new UnsafeProjectPathError("Repository paths must not traverse outside the project root.");
  }

  return resolved.join("/");
}

export async function findGitRoot(cwd: string): Promise<string | undefined> {
  try {
    const result = await execFileAsync("git", ["rev-parse", "--show-toplevel"], { cwd, windowsHide: true });
    const root = result.stdout.trim();
    return root.length > 0 ? root : undefined;
  } catch {
    return undefined;
  }
}

export async function resolveProjectRoot(
  cwd: string,
  gitRootLookup: GitRootLookup = findGitRoot,
): Promise<string> {
  const resolvedCwd = resolve(cwd);
  const gitRoot = await gitRootLookup(resolvedCwd);
  return gitRoot === undefined ? resolvedCwd : resolve(gitRoot);
}

export async function resolveSafeProjectPath(projectRoot: string, repositoryPath: string): Promise<string> {
  const normalizedPath = normalizeRepositoryPath(repositoryPath);
  const resolvedRoot = resolve(projectRoot);
  const candidate = resolve(resolvedRoot, ...normalizedPath.split("/"));

  if (!isContainedPath(resolvedRoot, candidate)) {
    throw new UnsafeProjectPathError("The requested path escapes the project root.");
  }

  const realRoot = await realpath(resolvedRoot);
  const realExistingAncestor = await findRealExistingAncestor(candidate);
  if (!isContainedPath(realRoot, realExistingAncestor)) {
    throw new UnsafeProjectPathError("The requested path escapes the project root through a symbolic link.");
  }

  return candidate;
}

function isContainedPath(root: string, candidate: string): boolean {
  const pathToCandidate = relative(root, candidate);
  return pathToCandidate === "" || (!pathToCandidate.startsWith(`..${sep}`) && pathToCandidate !== ".." && !isAbsolute(pathToCandidate));
}

async function findRealExistingAncestor(candidate: string): Promise<string> {
  let current = candidate;

  while (true) {
    try {
      return await realpath(current);
    } catch (error: unknown) {
      if (!isMissingPathError(error)) {
        throw error;
      }

      const parent = dirname(current);
      if (parent === current) {
        throw error;
      }
      current = parent;
    }
  }
}

function isMissingPathError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
