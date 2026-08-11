import { realpath, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, isAbsolute, parse, relative, resolve, sep, win32 } from "node:path";

export class UnsafeUserPathError extends Error {
  override name = "UnsafeUserPathError";
}

export type HomeResolver = () => Promise<string>;

export interface UserPathRoot {
  /** Absolute filesystem path for internal file operations only. */
  readonly path: string;
  /** Safe path for human/JSON output; it never includes the actual home path. */
  readonly logicalPath: string;
  /** Renders a safe descendant without exposing the physical home path. */
  display(relativePath?: string): string;
  /** @internal Real containment boundary captured while resolving the root. */
  readonly containmentAnchor: string;
}

export interface UserPlatformRoots {
  readonly kiro: UserPathRoot;
  readonly antigravityDesktop: UserPathRoot;
  readonly antigravityCli: UserPathRoot;
  readonly codex: {
    readonly config: UserPathRoot;
    readonly skills: UserPathRoot;
  };
}

/** Public integration identities used to resolve only authorized platform roots. */
export type UserGlobalPlatform = "kiro" | "antigravity" | "codex";

/**
 * A deliberately partial root set. Global lifecycle commands receive only the
 * roots they were explicitly authorized to inspect or mutate; Doctor's
 * all-platform discovery continues to use the complete UserPlatformRoots.
 */
export interface SelectedUserPlatformRoots {
  readonly kiro?: UserPathRoot | undefined;
  readonly antigravityDesktop?: UserPathRoot | undefined;
  readonly antigravityCli?: UserPathRoot | undefined;
  readonly codex?: {
    readonly config: UserPathRoot;
    readonly skills: UserPathRoot;
  } | undefined;
}

export interface ResolveUserPlatformRootsOptions {
  homeResolver?: HomeResolver | undefined;
  environment?: Readonly<Record<string, string | undefined>> | undefined;
}

const defaultHomeResolver: HomeResolver = async () => homedir();

/**
 * Resolves the user-global roots for the supported platforms. The returned
 * physical paths are for internal writes; callers should use logicalPath/display
 * in every user-facing result.
 */
export async function resolveUserPlatformRoots(
  options: ResolveUserPlatformRootsOptions = {},
): Promise<UserPlatformRoots> {
  const roots = await resolveSelectedUserPlatformRoots(["kiro", "antigravity", "codex"], options);
  if (roots.kiro === undefined || roots.antigravityDesktop === undefined || roots.antigravityCli === undefined || roots.codex === undefined) {
    throw new UnsafeUserPathError("All supported user platform roots could not be resolved.");
  }
  return {
    antigravityCli: roots.antigravityCli,
    antigravityDesktop: roots.antigravityDesktop,
    codex: roots.codex,
    kiro: roots.kiro,
  };
}

/**
 * Resolves only the requested user-global integration roots. In particular,
 * a malformed CODEX_HOME must not block an explicit Kiro or Antigravity
 * lifecycle operation that never reads the Codex roots.
 */
export async function resolveSelectedUserPlatformRoots(
  platforms: readonly UserGlobalPlatform[],
  options: ResolveUserPlatformRootsOptions = {},
): Promise<SelectedUserPlatformRoots> {
  const selected = new Set(platforms);
  const home = await createVerifiedUserRoot(await (options.homeResolver ?? defaultHomeResolver)(), "~");
  const roots: {
    kiro?: UserPathRoot;
    antigravityDesktop?: UserPathRoot;
    antigravityCli?: UserPathRoot;
    codex?: { config: UserPathRoot; skills: UserPathRoot };
  } = {};

  if (selected.has("kiro")) {
    roots.kiro = await createDerivedUserRoot(home, ".kiro", "~/.kiro");
  }
  if (selected.has("antigravity")) {
    roots.antigravityCli = await createDerivedUserRoot(
      home,
      ".gemini/antigravity-cli/plugins/harnix",
      "~/.gemini/antigravity-cli/plugins/harnix",
    );
    roots.antigravityDesktop = await createDerivedUserRoot(
      home,
      ".gemini/config/plugins/harnix",
      "~/.gemini/config/plugins/harnix",
    );
  }
  if (selected.has("codex")) {
    const codexHome = (options.environment ?? process.env).CODEX_HOME;
    roots.codex = {
      config: codexHome === undefined
        ? await createDerivedUserRoot(home, ".codex", "~/.codex")
        : await createVerifiedUserRoot(assertCodexHome(codexHome), "$CODEX_HOME"),
      skills: await createDerivedUserRoot(home, ".agents", "~/.agents"),
    };
  }
  return roots;
}

/** Creates a root that can later be used only with resolveSafeUserPath. */
export async function createVerifiedUserRoot(path: string, logicalPath: string): Promise<UserPathRoot> {
  if (path.includes("\0") || !isAbsolute(path) || isFilesystemRoot(path)) {
    throw new UnsafeUserPathError("A user root must be an absolute non-root directory.");
  }
  if (!isSafeLogicalPath(logicalPath)) {
    throw new UnsafeUserPathError("A user root must have a safe logical display path.");
  }

  const root = resolve(path);
  await assertDirectoryIfItExists(root);
  return createUserPathRoot(root, logicalPath, await findRealExistingAncestor(root));
}

async function createDerivedUserRoot(
  parent: UserPathRoot,
  relativePath: string,
  logicalPath: string,
): Promise<UserPathRoot> {
  const path = await resolveSafeUserPath(parent, relativePath);
  return createUserPathRoot(path, logicalPath, await realpath(parent.path));
}

function createUserPathRoot(path: string, logicalPath: string, containmentAnchor: string): UserPathRoot {
  return {
    containmentAnchor,
    display: (relativePath = ".") => displayUserPath(logicalPath, relativePath),
    logicalPath,
    path,
  };
}

/** Resolves a POSIX relative path under a previously verified user-global root. */
export async function resolveSafeUserPath(root: UserPathRoot, userRelativePath: string): Promise<string> {
  const normalizedPath = normalizeUserRelativePath(userRelativePath);
  const candidate = resolve(root.path, ...normalizedPath.split("/"));
  if (!isContainedPath(root.path, candidate)) {
    throw new UnsafeUserPathError("The requested path escapes the user root.");
  }

  const realRoot = await realpathIfExists(root.path);
  if (realRoot !== undefined && !isContainedPath(root.containmentAnchor, realRoot)) {
    throw new UnsafeUserPathError("The user root escapes its verified containment boundary through a symbolic link.");
  }
  const realExistingAncestor = await findRealExistingAncestor(candidate);
  const containmentBoundary = realRoot ?? root.containmentAnchor;
  if (!isContainedPath(containmentBoundary, realExistingAncestor)) {
    throw new UnsafeUserPathError("The requested path escapes the user root through a symbolic link.");
  }

  return candidate;
}

export function displayUserPath(logicalRoot: string, relativePath = "."): string {
  if (!isSafeLogicalPath(logicalRoot)) {
    throw new UnsafeUserPathError("A user root must have a safe logical display path.");
  }
  if (relativePath === "." || relativePath.length === 0) return logicalRoot;
  return `${logicalRoot}/${normalizeUserRelativePath(relativePath)}`;
}

export function normalizeUserRelativePath(value: string): string {
  if (value.length === 0 || value.includes("\0") || isAbsolutePath(value)) {
    throw new UnsafeUserPathError("A user path must be non-empty and relative.");
  }

  const normalized = value.replaceAll("\\", "/").replace(/\/+/gu, "/");
  const segments = normalized.split("/");
  if (segments.some((segment) => segment.length === 0 || segment === "." || segment === ".." || hasControlCharacter(segment))) {
    throw new UnsafeUserPathError("User paths must not traverse outside their verified root.");
  }
  return segments.join("/");
}

function hasControlCharacter(value: string): boolean {
  for (const character of value) {
    const codePoint = character.charCodeAt(0);
    if (codePoint <= 0x1f || codePoint === 0x7f) return true;
  }
  return false;
}

function assertCodexHome(value: string): string {
  if (value.trim().length === 0 || value.includes("\0")) {
    throw new UnsafeUserPathError("CODEX_HOME must be a non-empty absolute directory when set.");
  }
  return value;
}

function isSafeLogicalPath(value: string): boolean {
  return value === "~" || value === "$CODEX_HOME" || value.startsWith("~/") || value.startsWith("$CODEX_HOME/");
}

function isAbsolutePath(value: string): boolean {
  return isAbsolute(value) || win32.isAbsolute(value);
}

function isFilesystemRoot(value: string): boolean {
  const native = resolve(value);
  if (native === parse(native).root) return true;
  if (!win32.isAbsolute(value)) return false;
  const normalized = win32.normalize(value);
  return normalized === win32.parse(normalized).root;
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
      if (!isMissingPathError(error)) throw error;
      const parent = dirname(current);
      if (parent === current) throw error;
      current = parent;
    }
  }
}

async function realpathIfExists(path: string): Promise<string | undefined> {
  try {
    return await realpath(path);
  } catch (error: unknown) {
    if (isMissingPathError(error)) return undefined;
    throw error;
  }
}

/**
 * A future platform root may legitimately not exist yet, but an existing
 * regular file cannot safely become a writable user-global root. Reject it
 * before lifecycle code reaches mkdir/write operations that would otherwise
 * fail late with an implementation-specific path error.
 */
async function assertDirectoryIfItExists(path: string): Promise<void> {
  try {
    if (!(await stat(path)).isDirectory()) {
      throw new UnsafeUserPathError("A user root must be a directory when it already exists.");
    }
  } catch (error: unknown) {
    if (isMissingPathError(error)) return;
    throw error;
  }
}

function isMissingPathError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
