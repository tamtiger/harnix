import { readConfig } from "src/core/config/config.js";
import { resolveActiveTask } from "src/core/tasks/task.js";
import {
  impactRepoMap,
  impactRepoMapTests,
  outlineRepoMap,
  queryRepoMap,
  refreshRepoMap,
  refsRepoMap,
} from "src/core/repo-map/service.js";
import { queryWorkspaceRepoMap, refreshWorkspaceRepoMap, statusWorkspaceRepoMap } from "src/core/repo-map/workspace.js";
import { readRepoMap } from "src/core/repo-map/store.js";
import { summarizeSkipped } from "src/core/repo-map/refresh-summary.js";
import { repoMapRefreshHint } from "src/core/repo-map/types.js";
import {
  buildMultiWorkspaceEventMatrix,
  buildProjectEventMatrix,
  buildWorkspaceEventMatrix,
} from "src/core/repo-map/event-matrix.js";
import { findInitializedProject, missingProjectError } from "src/utils/project-discovery.js";
import { resolveWorkspaceRoot } from "src/core/workspace/resolve-root.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";
import { compareCodeUnits } from "src/utils/order.js";

import {
  compactImpact,
  compactOutline,
  compactRefs,
  compactTests,
  formatQueryResults,
  parseRepoMapFormat,
  parseRepoMapListFormat,
  type RepoMapListFormat,
  type RepoMapQueryFormat,
} from "src/core/repo-map/compact.js";
import {
  parseRepoMapDepth,
  parseRepoMapLimit,
  parseRepoMapOutlineLimit,
  parseRepoMapPath,
  parseRepoMapSymbol,
  type RepoMapCliOptions,
  validateRepoMapOptions,
} from "src/cli-helpers.js";
import { isMissingPathError } from "src/utils/errno.js";

async function dispatchQueryOrStatus(cwd: string, options: RepoMapCliOptions, limit: number): Promise<unknown> {
  const wsPath = typeof options.workspace === "string" ? options.workspace : undefined;
  if (options.query !== undefined) {
    const format = parseRepoMapFormat(options.format);
    if (options.workspace !== undefined) {
      return queryWorkspaceRepoMapInternal(cwd, options.query, limit, format, wsPath);
    }
    return queryRepoMapInternal(cwd, options.query, limit, format);
  }
  if (options.workspace !== undefined) {
    return statusWorkspaceRepoMapInternal(cwd, wsPath);
  }
  return statusRepoMapInternal(cwd);
}

export async function runRepoMapCommand(cwd: string, options: RepoMapCliOptions): Promise<unknown> {
  validateRepoMapOptions(options);
  if (options.refresh) {
    if (options.limit !== undefined) throw new Error("--limit is not valid with repo-map --refresh.");
    const wsPath = typeof options.workspace === "string" ? options.workspace : undefined;
    return options.workspace !== undefined ? refreshWorkspaceRepoMapInternal(cwd, wsPath) : refreshRepoMapInternal(cwd);
  }
  if (options.outline !== undefined) {
    const symbol = options.symbol === undefined ? undefined : parseRepoMapSymbol(options.symbol, "--symbol");
    return outlineRepoMapInternal(
      cwd,
      parseRepoMapPath(options.outline, "--outline"),
      parseRepoMapOutlineLimit(options.limit ?? "20"),
      symbol,
      options.body === true,
      parseRepoMapListFormat(options.format),
    );
  }
  const limit = parseRepoMapLimit(options.limit ?? "20");
  if (options.refs !== undefined) {
    const target = options.path === undefined ? undefined : parseRepoMapPath(options.path, "--path");
    return refsRepoMapInternal(
      cwd,
      parseRepoMapSymbol(options.refs, "--refs"),
      limit,
      target,
      parseRepoMapListFormat(options.format),
    );
  }
  if (options.tests !== undefined) {
    return testsRepoMapInternal(
      cwd,
      parseRepoMapPath(options.tests, "--tests"),
      limit,
      parseRepoMapListFormat(options.format),
    );
  }
  if (options.impact !== undefined) {
    return impactRepoMapInternal(
      cwd,
      parseRepoMapPath(options.impact, "--impact"),
      parseRepoMapDepth(options.depth ?? "2"),
      limit,
      parseRepoMapListFormat(options.format),
    );
  }
  if (options.events) {
    const ws = options.workspace;
    const wsParam = typeof ws === "string" || Array.isArray(ws) ? ws : undefined;
    return ws !== undefined ? eventsWorkspaceRepoMapInternal(cwd, wsParam) : eventsRepoMapInternal(cwd);
  }
  return dispatchQueryOrStatus(cwd, options, limit);
}

export async function statusWorkspaceRepoMapInternal(cwd: string, workspacePath?: string): Promise<unknown> {
  const root = await resolveWorkspaceRoot(cwd, workspacePath);
  return statusWorkspaceRepoMap(root);
}

export async function statusRepoMapInternal(cwd: string): Promise<unknown> {
  const root = await initializedRoot(cwd);
  try {
    const map = await readRepoMap(root);
    return {
      generator: "harnix",
      inventoryFingerprint: map.inventoryFingerprint,
      records: map.records.length,
      schemaVersion: 1,
      scope: "project",
      status: "ready",
    };
  } catch (error: unknown) {
    const missing = isMissingPathError(error);
    return {
      generator: "harnix",
      hint: repoMapRefreshHint,
      schemaVersion: 1,
      scope: "project",
      status: missing ? "missing" : "invalid",
    };
  }
}

export async function eventsWorkspaceRepoMapInternal(cwd: string, workspacePath?: string | string[]): Promise<unknown> {
  const rawList = Array.isArray(workspacePath)
    ? workspacePath
    : workspacePath
      ? workspacePath
          .split(/[,\s]+/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
  if (rawList.length > 1) {
    const roots = await Promise.all(rawList.map((p) => resolveWorkspaceRoot(cwd, p)));
    return buildMultiWorkspaceEventMatrix(roots);
  }
  const root = await resolveWorkspaceRoot(cwd, rawList[0]);
  return buildWorkspaceEventMatrix(root);
}

export async function eventsRepoMapInternal(cwd: string): Promise<unknown> {
  const root = await initializedRoot(cwd);
  return buildProjectEventMatrix(root);
}

export async function refreshWorkspaceRepoMapInternal(cwd: string, workspacePath?: string): Promise<unknown> {
  const root = await resolveWorkspaceRoot(cwd, workspacePath);
  return refreshWorkspaceRepoMap(root);
}

export async function queryWorkspaceRepoMapInternal(
  cwd: string,
  query: string,
  limit: number,
  format: RepoMapQueryFormat = "json",
  workspacePath?: string,
): Promise<unknown> {
  const root = await resolveWorkspaceRoot(cwd, workspacePath);
  const result = await queryWorkspaceRepoMap({ limit, query, root });
  const formatted = formatQueryResults(result.results, format);
  return {
    ...(format === "json" ? {} : { format }),
    members: result.members,
    results: formatted,
    scope: "workspace",
  };
}

export async function refreshRepoMapInternal(cwd: string): Promise<unknown> {
  const root = await initializedRoot(cwd);
  const result = await refreshRepoMap({ root });
  return {
    records: result.map.records.length,
    scope: "project",
    ...summarizeSkipped(result.skipped),
    status: "refreshed",
  };
}

export async function queryRepoMapInternal(
  cwd: string,
  query: string,
  limit: number,
  format: RepoMapQueryFormat = "json",
): Promise<unknown> {
  const root = await initializedRoot(cwd);
  const [config, active] = await Promise.all([
    readConfig(await resolveSafeHarnixPath(root, "config.yaml")),
    resolveActiveTask(await resolveSafeHarnixPath(root)),
  ]);
  const result = await queryRepoMap({
    limit,
    query,
    root,
    signals: {
      languages: config.languages,
      relevantPaths: active?.relevantPaths,
      taskTerms: active === undefined ? [] : terms(active.title, active.goal),
      technologies: config.technologies,
    },
  });
  const formatted = formatQueryResults(result.results, format);
  return {
    ...(format === "json" ? {} : { format }),
    ...(result.status === "ready" ? {} : { hint: repoMapRefreshHint }),
    ...(result.status === "ready" && result.fallback !== undefined ? { fallback: result.fallback } : {}),
    results: formatted,
    scope: "project",
    status: result.status,
  };
}

export async function impactRepoMapInternal(
  cwd: string,
  target: string,
  depth: number,
  limit: number,
  format: RepoMapListFormat = "json",
): Promise<unknown> {
  const root = await initializedRoot(cwd);
  await readConfig(await resolveSafeHarnixPath(root, "config.yaml"));
  const result = await impactRepoMap({ root, target, depth, limit });
  return format === "compact" ? compactImpact(result) : result;
}

export async function testsRepoMapInternal(
  cwd: string,
  target: string,
  limit: number,
  format: RepoMapListFormat = "json",
): Promise<unknown> {
  const root = await initializedRoot(cwd);
  await readConfig(await resolveSafeHarnixPath(root, "config.yaml"));
  const result = await impactRepoMapTests({ limit, root, target });
  return format === "compact" ? compactTests(result) : result;
}

export async function outlineRepoMapInternal(
  cwd: string,
  target: string,
  limit: number,
  symbol?: string,
  body = false,
  format: RepoMapListFormat = "json",
): Promise<unknown> {
  const root = await initializedRoot(cwd);
  await readConfig(await resolveSafeHarnixPath(root, "config.yaml"));
  const result = await outlineRepoMap({
    limit,
    root,
    ...(symbol === undefined ? {} : { symbol }),
    ...(body ? { body: true } : {}),
    target,
  });
  return format === "compact" ? compactOutline(result) : result;
}

export async function refsRepoMapInternal(
  cwd: string,
  symbol: string,
  limit: number,
  target?: string,
  format: RepoMapListFormat = "json",
): Promise<unknown> {
  const root = await initializedRoot(cwd);
  await readConfig(await resolveSafeHarnixPath(root, "config.yaml"));
  const result = await refsRepoMap({ limit, root, symbol, ...(target === undefined ? {} : { target }) });
  return format === "compact" ? compactRefs(result) : result;
}

async function initializedRoot(cwd: string): Promise<string> {
  const project = await findInitializedProject({ cwd });
  if (project.kind !== "ready") throw await missingProjectError("Repo map", cwd);
  return project.root;
}

function terms(...values: string[]): string[] {
  return [
    ...new Set(
      values
        .join(" ")
        .toLowerCase()
        .match(/[\p{L}\p{N}_-]+/gu) ?? [],
    ),
  ].sort(compareCodeUnits);
}
