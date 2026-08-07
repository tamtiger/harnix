import { readFile, rm } from "node:fs/promises";
import { join } from "node:path";

import { ownershipState, readManifest, type ManagedEntry } from "../utils/managed-files.js";
import { resolveSafeProjectPath } from "../utils/paths.js";
import { atomicWriteFile } from "../utils/atomic-write.js";

const begin = "<!-- harnix:begin -->";
const end = "<!-- harnix:end -->";
const harnixCommand = "harnix internal context --platform codex";
export interface UninstallOptions { root: string; purge?: boolean | undefined; yes?: boolean | undefined; }
export interface UninstallResult { removed: string[]; preserved: string[]; purgeTargets: string[]; confirmationRequired: boolean; }

export async function uninstallProject(options: UninstallOptions): Promise<UninstallResult> {
  await resolveSafeProjectPath(options.root, ".harnix/config.yaml");
  const manifest = await optionalManifest(join(options.root, ".harnix", ".template-hashes.json"));
  const removed: string[] = [], preserved: string[] = [];
  for (const entry of manifest?.entries ?? []) {
    if (entry.scope === "project") continue;
    const state = await ownershipState(options.root, entry, entry);
    if (state === "unchanged") { await rm(await resolveSafeProjectPath(options.root, entry.path), { force: true }); removed.push(entry.path); }
    else preserved.push(entry.path);
  }
  await removeInjectionSurfaces(options.root, removed, preserved);
  const purgeTargets = options.purge ? [".harnix"] : [];
  if (options.purge && !options.yes) return { removed, preserved, purgeTargets, confirmationRequired: true };
  if (options.purge) { await rm(await resolveSafeProjectPath(options.root, ".harnix"), { force: true, recursive: true }); removed.push(".harnix"); }
  return { removed: removed.sort(), preserved: preserved.sort(), purgeTargets, confirmationRequired: false };
}

async function optionalManifest(path: string): Promise<{ entries: ManagedEntry[] } | undefined> { try { return await readManifest(path); } catch (error: unknown) { if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return undefined; throw error; } }
async function removeInjectionSurfaces(root: string, removed: string[], preserved: string[]): Promise<void> {
  for (const relative of ["AGENTS.md", "GEMINI.md"]) {
    const path = join(root, relative); const text = await optional(path); const start = text.indexOf(begin), finish = text.indexOf(end);
    if (start < 0 && finish < 0) continue;
    if (start < 0 || finish < start) { preserved.push(relative); continue; }
    await atomicWriteFile(path, `${text.slice(0, start)}${text.slice(finish + end.length)}`.replace(/^\s+|\s+$/gu, "").concat("\n")); removed.push(`${relative}#harnix`);
  }
  const hookPath = join(root, ".codex", "hooks.json"); const hookText = await optional(hookPath);
  if (hookText) {
    try {
      const value = JSON.parse(hookText) as { hooks?: { UserPromptSubmit?: unknown[] } };
      const hooks = value.hooks?.UserPromptSubmit;
      if (hooks) { const retained = hooks.filter((hook) => !(typeof hook === "object" && hook !== null && (hook as { command?: string }).command === harnixCommand)); if (retained.length !== hooks.length) { value.hooks!.UserPromptSubmit = retained; await atomicWriteFile(hookPath, `${JSON.stringify(value, null, 2)}\n`); removed.push(".codex/hooks.json#harnix"); } }
    } catch { preserved.push(".codex/hooks.json"); }
  }
}
async function optional(path: string): Promise<string> { try { return await readFile(path, "utf8"); } catch (error: unknown) { if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return ""; throw error; } }
