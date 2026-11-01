import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** True when this process may create file symlinks (Windows needs developer mode or elevation). */
export function fileSymlinksSupported(): boolean {
  const directory = mkdtempSync(join(tmpdir(), "harnix-symlink-probe-"));
  try {
    writeFileSync(join(directory, "target"), "x");
    symlinkSync(join(directory, "target"), join(directory, "link"), "file");
    return true;
  } catch {
    return false;
  } finally {
    rmSync(directory, { force: true, recursive: true });
  }
}

/** Directory link that works without privilege on Windows (junction) and as a normal symlink elsewhere. */
export async function linkDirectory(target: string, path: string): Promise<void> {
  await symlink(target, path, "junction");
}
