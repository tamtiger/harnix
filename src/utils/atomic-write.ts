import { chmod, lstat, mkdir, realpath, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { randomBytes } from "node:crypto";
import { isMissingPathError } from "src/utils/errno.js";
import { renameWithRetry } from "src/utils/rename-retry.js";

export interface AtomicFileSystem {
  mkdir(directory: string, options: { recursive: true }): Promise<unknown>;
  writeFile(filePath: string, content: string | Uint8Array): Promise<void>;
  rename(source: string, destination: string): Promise<void>;
  rm(filePath: string, options: { force: true }): Promise<void>;
  stat?(filePath: string): Promise<{ mode: number }>;
  chmod?(filePath: string, mode: number): Promise<void>;
  lstat?(filePath: string): Promise<{ isSymbolicLink(): boolean }>;
  realpath?(filePath: string): Promise<string>;
}

export interface AtomicWriteOptions {
  filesystem?: AtomicFileSystem;
  randomSuffix?: () => string;
  /** Bounded delays before retrying transient rename failures. Defaults to a short Windows-only schedule. */
  renameRetryDelaysMs?: readonly number[];
}

const windowsRenameRetryDelaysMs = [10, 25, 50, 100, 200, 400] as const;

const defaultFilesystem: AtomicFileSystem = {
  chmod,
  lstat,
  mkdir,
  realpath,
  writeFile,
  rename,
  rm,
  stat,
};

/**
 * Replaces a file atomically. A symlink destination is followed once so the real target is replaced and the link
 * survives; a dangling link is refused. Keeping symlinks inside a safe root is the caller's job (resolveSafe* helpers).
 */
export async function atomicWriteFile(
  requestedDestination: string,
  content: string | Uint8Array,
  options: AtomicWriteOptions = {},
): Promise<void> {
  const filesystem = options.filesystem ?? defaultFilesystem;
  const randomSuffix = options.randomSuffix ?? (() => randomBytes(12).toString("hex"));
  const renameRetryDelaysMs = validateRenameRetryDelays(
    options.renameRetryDelaysMs ?? (process.platform === "win32" ? windowsRenameRetryDelaysMs : []),
  );
  const destination = await followSymlink(filesystem, requestedDestination);
  const temporaryPath = `${destination}.${randomSuffix()}.tmp`;
  const preservedMode = await existingMode(filesystem, destination);

  await filesystem.mkdir(dirname(destination), { recursive: true });

  try {
    await filesystem.writeFile(temporaryPath, content);
    if (preservedMode !== undefined && filesystem.chmod !== undefined)
      await filesystem.chmod(temporaryPath, preservedMode);
    await renameWithRetry(temporaryPath, destination, (from, to) => filesystem.rename(from, to), renameRetryDelaysMs);
  } catch (error) {
    try {
      await filesystem.rm(temporaryPath, { force: true });
    } catch {
      // Preserve the original write failure when best-effort cleanup also fails.
    }
    throw error;
  }
}

async function followSymlink(filesystem: AtomicFileSystem, destination: string): Promise<string> {
  if (filesystem.lstat === undefined || filesystem.realpath === undefined) return destination;
  try {
    if (!(await filesystem.lstat(destination)).isSymbolicLink()) return destination;
  } catch (error: unknown) {
    if (isMissingPathError(error)) return destination;
    throw error;
  }
  try {
    return await filesystem.realpath(destination);
  } catch {
    throw new Error("Refusing to write through a dangling symlink destination.");
  }
}

function validateRenameRetryDelays(value: readonly number[]): readonly number[] {
  if (value.length > 10 || value.some((delay) => !Number.isSafeInteger(delay) || delay < 0 || delay > 1_000)) {
    throw new TypeError("Atomic rename retry delays must contain at most 10 integers between 0 and 1000 milliseconds.");
  }
  return value;
}

async function existingMode(filesystem: AtomicFileSystem, destination: string): Promise<number | undefined> {
  if (filesystem.stat === undefined || filesystem.chmod === undefined) return undefined;
  try {
    return (await filesystem.stat(destination)).mode & 0o7777;
  } catch (error: unknown) {
    if (isMissingPathError(error)) return undefined;
    throw error;
  }
}
