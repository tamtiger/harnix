/**
 * Declarative registry of the supported coding-agent platforms. A platform is a data record: every
 * flag list, root table, hook payload shape and render cap is read from here instead of branching
 * on the platform name. Adding a platform later means adding one record and a test fixture.
 */

import type { PlatformFact } from "src/core/platform/facts.js";
import { PLATFORM_RECORDS } from "src/core/platform/records.js";

export type { PlatformFact };
export { PLATFORM_RECORDS };
export type PlatformId = "kiro" | "antigravity" | "codex" | "claude" | "opencode" | "cursor";

/** How a platform's context hook must print its payload. */
export type ContextOutputKind = "plain" | "codex-additional-context" | "antigravity-inject-steps";

export interface PlatformRoot {
  /** Stable key referenced by `skillDirectories` (for example `config`, `desktop`). */
  readonly key: string;
  /** Path below the user's home directory, POSIX separators. */
  readonly relativePath: string;
  /** Home-free path used in diagnostics and JSON output. */
  readonly logicalPath: string;
  /** Environment variable that relocates the root, or null. */
  readonly envOverride: string | null;
  /**
   * Set when the variable names a parent directory (an XDG base directory) rather than the root itself: the root is
   * then `<variable>/<subpath>`, and a variable that is empty or not an absolute path is ignored as the XDG spec says.
   */
  readonly envOverrideSubpath?: string;
}

/** Physical ownership namespaces a platform writes to (a sidecar lives in each). */
export type GlobalPlatformId =
  "kiro" | "antigravity-desktop" | "antigravity-cli" | "codex" | "claude" | "opencode" | "cursor";

/** What a healthy install reports when no external evidence says more. */
export type HealthyReadiness = "installed" | "installed-pending-trust" | "precedence-unknown";

export interface PlatformTarget {
  /** Key of the root (see `roots`) this target writes below. */
  readonly rootKey: string;
  readonly globalPlatform: GlobalPlatformId;
  /** Ownership sidecar, relative to the root. */
  readonly manifestPath: string;
  /** Cross-process lock, relative to the root. */
  readonly lockPath: string;
  /** True when a pre-existing root without a Harnix sidecar belongs to someone else. */
  readonly preserveUnownedRoot: boolean;
  /** Key the configurator layer uses to supply the desired files for this target. */
  readonly planKey: string;
}

export interface PlatformHook {
  /** Native event name the platform fires (verified in `facts`). */
  readonly event: string;
  readonly command: string;
}

export interface PlatformRecord {
  readonly id: string;
  readonly label: string;
  /** CLI flag name without the leading dashes. */
  readonly flag: string;
  /** Launcher executable used for readiness checks, or null when none exists. */
  readonly executable: string | null;
  readonly roots: readonly PlatformRoot[];
  /** `<root key>:<relative directory>` entries; a tool may read several at once. */
  readonly skillDirectories: readonly string[];
  /** Instruction file relative to the first root, or null (no global instruction file). */
  readonly instructionFile: string | null;
  /** Shell context hook, or null (no shell hook). */
  readonly contextHook: PlatformHook | null;
  readonly contextOutput: ContextOutputKind;
  /** True when the host allows context injection only on its first invocation (invocationNum 0). */
  readonly contextFirstInvocationOnly: boolean;
  /** Hard cap on rendered context characters, or null to use the configured cap. */
  readonly contextRenderCap: number | null;
  /** Sidecar-owning targets installed for this platform, in reconcile order. */
  readonly targets: readonly PlatformTarget[];
  readonly healthyReadiness: HealthyReadiness;
  /** Extra warning attached to every successful setup, or null. */
  readonly setupNotice: string | null;
  /** Variable that, set to another directory, makes the documented root ambiguous (diagnosed, never followed). */
  readonly ambiguousRootEnv: string | null;
  /** Files that, when non-empty, take precedence over the Harnix instruction file. */
  readonly shadowingFiles: readonly {
    readonly rootKey: string;
    readonly path: string;
    /** Stable finding-code prefix (`<code>-shadowed`, `<code>-invalid`). */
    readonly code: string;
    /** Noun used in messages, for example "AGENTS override". */
    readonly subject: string;
  }[];
  readonly facts: readonly PlatformFact[];
}

export const PLATFORM_IDS: readonly PlatformId[] = PLATFORM_RECORDS.map((record) => record.id);

const PLATFORM_MESSAGE = "--platform must be kiro, antigravity, codex, claude, opencode, or cursor.";

export function platformRecords(): readonly PlatformRecord[] {
  return PLATFORM_RECORDS;
}

export function isPlatformId(value: unknown): value is PlatformId {
  return typeof value === "string" && (PLATFORM_IDS as readonly string[]).includes(value);
}

export function parsePlatformId(value: string | undefined): PlatformId {
  if (!isPlatformId(value)) throw new Error(PLATFORM_MESSAGE);
  return value;
}

export function getPlatform(id: PlatformId): PlatformRecord {
  const record = PLATFORM_RECORDS.find((candidate) => candidate.id === id);
  if (record === undefined) throw new Error(PLATFORM_MESSAGE);
  return record;
}

/** Returns human-readable problems; an empty list means the records are consistent. */
export function validatePlatformRecords(records: readonly PlatformRecord[]): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  const flags = new Set<string>();
  for (const record of records) {
    if (ids.has(record.id)) problems.push(`duplicate platform id: ${record.id}`);
    if (flags.has(record.flag)) problems.push(`duplicate platform flag: ${record.flag}`);
    ids.add(record.id);
    flags.add(record.flag);
    const rootKeys = new Set(record.roots.map((root) => root.key));
    for (const directory of record.skillDirectories) {
      const rootKey = directory.split(":")[0] ?? "";
      if (!rootKeys.has(rootKey)) problems.push(`${record.id}: skill directory references unknown root ${rootKey}`);
    }
    for (const target of record.targets) {
      if (!rootKeys.has(target.rootKey))
        problems.push(`${record.id}: target references unknown root ${target.rootKey}`);
    }
  }
  return problems;
}
