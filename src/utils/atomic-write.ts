import { chmod, mkdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { randomBytes } from "node:crypto";

export interface AtomicFileSystem {
  mkdir(directory: string, options: { recursive: true }): Promise<unknown>;
  writeFile(filePath: string, content: string | Uint8Array): Promise<void>;
  rename(source: string, destination: string): Promise<void>;
  rm(filePath: string, options: { force: true }): Promise<void>;
  stat?(filePath: string): Promise<{ mode: number }>;
  chmod?(filePath: string, mode: number): Promise<void>;
}

export interface AtomicWriteOptions {
  filesystem?: AtomicFileSystem;
  randomSuffix?: () => string;
  /** Bounded delays before retrying transient rename failures. Defaults to a short Windows-only schedule. */
  renameRetryDelaysMs?: readonly number[];
}

const windowsRenameRetryDelaysMs = [10, 25, 50, 100] as const;

const defaultFilesystem: AtomicFileSystem = {
  chmod,
  mkdir,
  writeFile,
  rename,
  rm,
  stat,
};

export async function atomicWriteFile(
  destination: string,
  content: string | Uint8Array,
  options: AtomicWriteOptions = {},
): Promise<void> {
  const filesystem = options.filesystem ?? defaultFilesystem;
  const randomSuffix = options.randomSuffix ?? (() => randomBytes(12).toString("hex"));
  const renameRetryDelaysMs = validateRenameRetryDelays(options.renameRetryDelaysMs
    ?? (process.platform === "win32" ? windowsRenameRetryDelaysMs : []));
  const temporaryPath = `${destination}.${randomSuffix()}.tmp`;
  const preservedMode = await existingMode(filesystem, destination);

  await filesystem.mkdir(dirname(destination), { recursive: true });

  try {
    await filesystem.writeFile(temporaryPath, content);
    if (preservedMode !== undefined && filesystem.chmod !== undefined) await filesystem.chmod(temporaryPath, preservedMode);
    await renameWithRetry(filesystem, temporaryPath, destination, renameRetryDelaysMs);
  } catch (error) {
    try {
      await filesystem.rm(temporaryPath, { force: true });
    } catch {
      // Preserve the original write failure when best-effort cleanup also fails.
    }
    throw error;
  }
}

async function renameWithRetry(
  filesystem: AtomicFileSystem,
  source: string,
  destination: string,
  retryDelaysMs: readonly number[],
): Promise<void> {
  let retryIndex = 0;
  while (true) {
    try {
      await filesystem.rename(source, destination);
      return;
    } catch (error: unknown) {
      if (!isTransientRenameError(error) || retryIndex >= retryDelaysMs.length) throw error;
      const delayMs = retryDelaysMs[retryIndex++]!;
      if (delayMs > 0) await new Promise<void>((resolveDelay) => setTimeout(resolveDelay, delayMs));
    }
  }
}

function validateRenameRetryDelays(value: readonly number[]): readonly number[] {
  if (value.length > 10 || value.some((delay) => !Number.isSafeInteger(delay) || delay < 0 || delay > 1_000)) {
    throw new TypeError("Atomic rename retry delays must contain at most 10 integers between 0 and 1000 milliseconds.");
  }
  return value;
}

function isTransientRenameError(error: unknown): boolean {
  return typeof error === "object"
    && error !== null
    && "code" in error
    && ["EACCES", "EBUSY", "EPERM"].includes(String((error as { code?: unknown }).code));
}

async function existingMode(filesystem: AtomicFileSystem, destination: string): Promise<number | undefined> {
  if (filesystem.stat === undefined || filesystem.chmod === undefined) return undefined;
  try {
    return (await filesystem.stat(destination)).mode & 0o7777;
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return undefined;
    throw error;
  }
}

