/**
 * Declarative registry of the supported coding-agent platforms. A platform is a data record: every
 * flag list, root table, hook payload shape and render cap is read from here instead of branching
 * on the platform name. Adding a platform later means adding one record and a test fixture.
 */

import {
  ANTIGRAVITY_FACTS,
  CLAUDE_FACTS,
  CODEX_FACTS,
  KIRO_FACTS,
  type PlatformFact,
} from "src/core/platform/facts.js";

export type { PlatformFact };
export type PlatformId = "kiro" | "antigravity" | "codex" | "claude";

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
}

/** Physical ownership namespaces a platform writes to (a sidecar lives in each). */
export type GlobalPlatformId = "kiro" | "antigravity-desktop" | "antigravity-cli" | "codex" | "claude";

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

export const PLATFORM_RECORDS = [
  {
    id: "kiro",
    label: "Kiro",
    flag: "kiro",
    executable: "kiro-cli",
    roots: [{ key: "config", relativePath: ".kiro", logicalPath: "~/.kiro", envOverride: null }],
    skillDirectories: ["config:skills"],
    instructionFile: "steering/harnix.md",
    contextHook: { event: "UserPromptSubmit", command: "harnix context --platform kiro" },
    contextOutput: "plain",
    contextFirstInvocationOnly: false,
    contextRenderCap: null,
    targets: [
      {
        rootKey: "config",
        globalPlatform: "kiro",
        manifestPath: "harnix/managed.json",
        lockPath: "harnix/managed.lock",
        preserveUnownedRoot: false,
        planKey: "kiro",
      },
    ],
    healthyReadiness: "installed",
    setupNotice: null,
    ambiguousRootEnv: "KIRO_HOME",
    shadowingFiles: [],
    facts: KIRO_FACTS,
  },
  {
    id: "antigravity",
    label: "Antigravity",
    flag: "antigravity",
    executable: "agy",
    roots: [
      {
        key: "desktop",
        relativePath: ".gemini/config/plugins/harnix",
        logicalPath: "~/.gemini/config/plugins/harnix",
        envOverride: null,
      },
      {
        key: "cli",
        relativePath: ".gemini/antigravity-cli/plugins/harnix",
        logicalPath: "~/.gemini/antigravity-cli/plugins/harnix",
        envOverride: null,
      },
    ],
    skillDirectories: ["desktop:skills", "cli:skills"],
    instructionFile: "rules/AGENTS.md",
    contextHook: { event: "PreInvocation", command: "harnix context --platform antigravity" },
    contextOutput: "antigravity-inject-steps",
    contextFirstInvocationOnly: true,
    contextRenderCap: null,
    targets: [
      {
        rootKey: "desktop",
        globalPlatform: "antigravity-desktop",
        manifestPath: ".managed.json",
        lockPath: ".managed.lock",
        preserveUnownedRoot: true,
        planKey: "antigravity-plugin",
      },
      {
        rootKey: "cli",
        globalPlatform: "antigravity-cli",
        manifestPath: ".managed.json",
        lockPath: ".managed.lock",
        preserveUnownedRoot: true,
        planKey: "antigravity-plugin",
      },
    ],
    healthyReadiness: "precedence-unknown",
    setupNotice:
      "Antigravity plugin-versus-workspace hook precedence is not verified; inspect the active tool session before relying on injection.",
    ambiguousRootEnv: null,
    shadowingFiles: [],
    facts: ANTIGRAVITY_FACTS,
  },
  {
    id: "codex",
    label: "Codex",
    flag: "codex",
    executable: "codex",
    roots: [
      { key: "config", relativePath: ".codex", logicalPath: "~/.codex", envOverride: "CODEX_HOME" },
      { key: "skills", relativePath: ".agents", logicalPath: "~/.agents", envOverride: null },
    ],
    skillDirectories: ["skills:skills"],
    instructionFile: "AGENTS.md",
    contextHook: { event: "UserPromptSubmit", command: "harnix context --platform codex" },
    contextOutput: "codex-additional-context",
    contextFirstInvocationOnly: false,
    contextRenderCap: 2_500,
    targets: [
      {
        rootKey: "config",
        globalPlatform: "codex",
        manifestPath: "harnix/managed.json",
        lockPath: "harnix/managed.lock",
        preserveUnownedRoot: false,
        planKey: "codex-config",
      },
      {
        rootKey: "skills",
        globalPlatform: "codex",
        manifestPath: "harnix/managed.json",
        lockPath: "harnix/managed.lock",
        preserveUnownedRoot: false,
        planKey: "codex-skills",
      },
    ],
    healthyReadiness: "installed-pending-trust",
    setupNotice: "Review and trust the exact Harnix hook from Codex /hooks before it can run.",
    ambiguousRootEnv: null,
    shadowingFiles: [
      { rootKey: "config", path: "AGENTS.override.md", code: "codex-agents-override", subject: "AGENTS override" },
    ],
    facts: CODEX_FACTS,
  },
  {
    id: "claude",
    label: "Claude Code",
    flag: "claude",
    executable: "claude",
    roots: [{ key: "config", relativePath: ".claude", logicalPath: "~/.claude", envOverride: "CLAUDE_CONFIG_DIR" }],
    skillDirectories: ["config:skills"],
    instructionFile: "CLAUDE.md",
    contextHook: { event: "UserPromptSubmit", command: "harnix context --platform claude" },
    contextOutput: "plain",
    contextFirstInvocationOnly: false,
    contextRenderCap: null,
    targets: [
      {
        rootKey: "config",
        globalPlatform: "claude",
        manifestPath: "harnix/managed.json",
        lockPath: "harnix/managed.lock",
        preserveUnownedRoot: false,
        planKey: "claude",
      },
    ],
    healthyReadiness: "installed",
    setupNotice: null,
    ambiguousRootEnv: null,
    shadowingFiles: [],
    facts: CLAUDE_FACTS,
  },
] as const satisfies readonly PlatformRecord[];

export const PLATFORM_IDS: readonly PlatformId[] = PLATFORM_RECORDS.map((record) => record.id);

const PLATFORM_MESSAGE = "--platform must be kiro, antigravity, codex, or claude.";

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
