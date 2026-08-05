import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { randomBytes } from "node:crypto";

export interface AtomicFileSystem {
  mkdir(directory: string, options: { recursive: true }): Promise<unknown>;
  writeFile(filePath: string, content: string | Uint8Array): Promise<void>;
  rename(source: string, destination: string): Promise<void>;
  rm(filePath: string, options: { force: true }): Promise<void>;
}

export interface AtomicWriteOptions {
  filesystem?: AtomicFileSystem;
  randomSuffix?: () => string;
}

const defaultFilesystem: AtomicFileSystem = {
  mkdir,
  writeFile,
  rename,
  rm,
};

export async function atomicWriteFile(
  destination: string,
  content: string | Uint8Array,
  options: AtomicWriteOptions = {},
): Promise<void> {
  const filesystem = options.filesystem ?? defaultFilesystem;
  const randomSuffix = options.randomSuffix ?? (() => randomBytes(12).toString("hex"));
  const temporaryPath = `${destination}.${randomSuffix()}.tmp`;

  await filesystem.mkdir(dirname(destination), { recursive: true });

  try {
    await filesystem.writeFile(temporaryPath, content);
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

