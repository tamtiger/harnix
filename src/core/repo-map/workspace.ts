import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { existsSync, readdirSync } from "node:fs";

import { refreshRepoMap } from "./service.js";
import { searchRepoMap } from "./search.js";
import { readRepoMap } from "./store.js";
import {
  isInitializedDirectory,
  memberSliceOfRootMap,
  MISSING_CACHE_HINT,
  readWorkspaceRootCache,
  refreshWorkspaceRootCache,
  WORKSPACE_ROOT_NOT_INITIALIZED,
  type WorkspaceRootCache,
} from "./workspace-root-cache.js";
import type { RepoMapQueryResult, RepoMapQuerySignals, RepoMapV1 } from "./types.js";
import { compareCodeUnits } from "src/utils/order.js";

const IGNORED_DIRS = new Set([
  ".git",
  ".harnix",
  "node_modules",
  "dist",
  "build",
  "out",
  ".vs",
  ".idea",
  "coverage",
  ".worktrees",
  ".kilo",
  ".agents",
  ".claude",
  ".gemini",
  ".cursor",
  ".codex",
]);

const MANIFEST_FILES = [
  "package.json",
  "pom.xml",
  "go.mod",
  "Cargo.toml",
  "build.gradle",
  "build.gradle.kts",
  "requirements.txt",
  "pyproject.toml",
  "Makefile",
];

export interface WorkspaceMember {
  name: string;
  path: string;
  hasHarnix: boolean;
  /** Has `.harnix/config.yaml`: the only kind of member that may hold a cache of its own. */
  initialized: boolean;
}

export interface WorkspaceQueryOptions {
  root: string;
  query: string;
  limit?: number | undefined;
  signals?: RepoMapQuerySignals | undefined;
}

export interface WorkspaceMemberResultSummary {
  name: string;
  status: "ready" | "missing" | "invalid";
  records: number;
  source?: "member" | "workspace";
  hint?: string;
}

export interface WorkspaceQueryResult {
  scope: "workspace";
  members: WorkspaceMemberResultSummary[];
  results: RepoMapQueryResult[];
}

export interface WorkspaceRefreshResult {
  scope: "workspace";
  status: "refreshed";
  members: Array<{
    name: string;
    records: number;
    skipped: string[];
  }>;
}

function hasProjectManifest(dir: string): boolean {
  if (MANIFEST_FILES.some((file) => existsSync(join(dir, file)))) return true;
  try {
    const files = readdirSync(dir);
    return files.some((f) => f.endsWith(".csproj") || f.endsWith(".sln") || f.endsWith(".fsproj"));
  } catch {
    return false;
  }
}

/**
 * Discovers sub-repositories within a workspace root.
 * Supports direct children and 2-level nesting (e.g., services/payment-hub).
 */
export async function discoverWorkspaceMembers(workspaceRoot: string): Promise<WorkspaceMember[]> {
  const members: WorkspaceMember[] = [];
  let entries: string[];
  try {
    entries = await readdir(workspaceRoot);
  } catch {
    return [];
  }

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry) || entry.startsWith(".")) continue;
    const fullPath = join(workspaceRoot, entry);
    try {
      const s = await stat(fullPath);
      if (!s.isDirectory()) continue;

      const hasHarnix = existsSync(join(fullPath, ".harnix"));
      if (hasHarnix || hasProjectManifest(fullPath) || existsSync(join(fullPath, ".git"))) {
        members.push({ hasHarnix, initialized: await isInitializedDirectory(fullPath), name: entry, path: fullPath });
        continue;
      }

      // If level 1 folder is a category / group (e.g. services/ or apps/), inspect level 2
      const subEntries = await readdir(fullPath);
      for (const sub of subEntries) {
        if (IGNORED_DIRS.has(sub) || sub.startsWith(".")) continue;
        const subPath = join(fullPath, sub);
        try {
          const subStat = await stat(subPath);
          if (!subStat.isDirectory()) continue;
          const subHarnix = existsSync(join(subPath, ".harnix"));
          if (subHarnix || hasProjectManifest(subPath) || existsSync(join(subPath, ".git"))) {
            members.push({
              hasHarnix: subHarnix,
              initialized: await isInitializedDirectory(subPath),
              name: `${entry}/${sub}`,
              path: subPath,
            });
          }
        } catch {
          // ignore unreadable nested subpath
        }
      }
    } catch {
      // ignore unreadable path
    }
  }

  members.sort((a, b) => compareCodeUnits(a.name, b.name));
  return members;
}

export async function refreshWorkspaceRepoMap(workspaceRoot: string): Promise<WorkspaceRefreshResult> {
  const members = await discoverWorkspaceMembers(workspaceRoot);
  const results: WorkspaceRefreshResult["members"] = [];
  const uncovered = members.filter((member) => !member.initialized);
  const rootMap =
    uncovered.length > 0 && (await isInitializedDirectory(workspaceRoot))
      ? await refreshWorkspaceRootCache(workspaceRoot)
      : undefined;
  if (uncovered.length > 0 && rootMap === undefined) throw new Error(WORKSPACE_ROOT_NOT_INITIALIZED);

  for (const member of members) {
    if (!member.initialized) {
      results.push({
        name: member.name,
        records: rootMap === undefined ? 0 : (memberSliceOfRootMap(rootMap, member.name)?.records.length ?? 0),
        skipped: ["Covered by the workspace root cache"],
      });
      continue;
    }
    try {
      const refreshed = await refreshRepoMap({ root: member.path });
      results.push({ name: member.name, records: refreshed.map.records.length, skipped: refreshed.skipped });
    } catch {
      results.push({ name: member.name, records: 0, skipped: ["Failed to refresh"] });
    }
  }

  return { members: results, scope: "workspace", status: "refreshed" };
}

type MemberCache =
  { status: "ready"; map: RepoMapV1; source: "member" | "workspace" } | { status: "missing" | "invalid" };

async function readMemberCache(
  member: WorkspaceMember,
  rootCache: () => Promise<WorkspaceRootCache>,
): Promise<MemberCache> {
  if (member.initialized) {
    try {
      return { map: await readRepoMap(member.path), source: "member", status: "ready" };
    } catch (error: unknown) {
      const missing = typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
      if (!missing) return { status: "invalid" };
    }
  }
  const root = await rootCache();
  if (root.status !== "ready") return { status: root.status };
  const slice = memberSliceOfRootMap(root.map, member.name);
  return slice === undefined ? { status: "missing" } : { map: slice, source: "workspace", status: "ready" };
}

export async function queryWorkspaceRepoMap(options: WorkspaceQueryOptions): Promise<WorkspaceQueryResult> {
  const members = await discoverWorkspaceMembers(options.root);
  const memberSummaries: WorkspaceMemberResultSummary[] = [];
  const allResults: RepoMapQueryResult[] = [];
  let cachedRoot: Promise<WorkspaceRootCache> | undefined;
  const rootCache = (): Promise<WorkspaceRootCache> => (cachedRoot ??= readWorkspaceRootCache(options.root));

  for (const member of members) {
    const cache = await readMemberCache(member, rootCache);
    if (cache.status !== "ready") {
      memberSummaries.push({
        ...(cache.status === "missing" ? { hint: MISSING_CACHE_HINT } : {}),
        name: member.name,
        records: 0,
        status: cache.status,
      });
      continue;
    }
    memberSummaries.push({
      name: member.name,
      records: cache.map.records.length,
      source: cache.source,
      status: "ready",
    });
    for (const res of searchRepoMap(cache.map, options.query, options.limit ?? 20, options.signals)) {
      allResults.push(cache.source === "member" ? { ...res, path: `${member.name}/${res.path}` } : res);
    }
  }

  allResults.sort((a, b) => b.score - a.score || compareCodeUnits(a.path, b.path));
  return { members: memberSummaries, results: allResults.slice(0, options.limit ?? 20), scope: "workspace" };
}
