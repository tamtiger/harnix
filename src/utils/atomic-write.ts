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
}

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
  const temporaryPath = `${destination}.${randomSuffix()}.tmp`;
  const preservedMode = await existingMode(filesystem, destination);

  await filesystem.mkdir(dirname(destination), { recursive: true });

  try {
    await filesystem.writeFile(temporaryPath, content);
    if (preservedMode !== undefined && filesystem.chmod !== undefined) await filesystem.chmod(temporaryPath, preservedMode);
    await filesystem.rename(temporaryPath, destination);
  } catch (error) {
    try {
      await filesystem.rm(temporaryPath, { force: true });
    } catch {
      // Preserve the original write failure when best-effort cleanup also fails.
    }
    throw error;
  }
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

