import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

import { refreshRepoMap } from "./service.js";
import { searchRepoMap } from "./search.js";
import { readRepoMap } from "./store.js";
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
  return MANIFEST_FILES.some((file) => existsSync(join(dir, file)));
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
        members.push({ hasHarnix, name: entry, path: fullPath });
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
            members.push({ hasHarnix: subHarnix, name: `${entry}/${sub}`, path: subPath });
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

  for (const member of members) {
    try {
      const refreshed = await refreshRepoMap({ root: member.path });
      results.push({
        name: member.name,
        records: refreshed.map.records.length,
        skipped: refreshed.skipped,
      });
    } catch {
      results.push({
        name: member.name,
        records: 0,
        skipped: ["Failed to refresh"],
      });
    }
  }

  return {
    members: results,
    scope: "workspace",
    status: "refreshed",
  };
}

export async function queryWorkspaceRepoMap(options: WorkspaceQueryOptions): Promise<WorkspaceQueryResult> {
  const members = await discoverWorkspaceMembers(options.root);
  const memberSummaries: WorkspaceMemberResultSummary[] = [];
  const allResults: RepoMapQueryResult[] = [];

  for (const member of members) {
    let map: RepoMapV1;
    try {
      map = await readRepoMap(member.path);
      memberSummaries.push({
        name: member.name,
        records: map.records.length,
        status: "ready",
      });
      const searchResults = searchRepoMap(map, options.query, options.limit ?? 20, options.signals);
      for (const res of searchResults) {
        allResults.push({
          ...res,
          path: `${member.name}/${res.path}`,
        });
      }
    } catch (error: unknown) {
      const isMissing = typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
      memberSummaries.push({
        name: member.name,
        records: 0,
        status: isMissing ? "missing" : "invalid",
      });
    }
  }

  allResults.sort((a, b) => b.score - a.score || compareCodeUnits(a.path, b.path));
  const limit = options.limit ?? 20;

  return {
    members: memberSummaries,
    results: allResults.slice(0, limit),
    scope: "workspace",
  };
}
