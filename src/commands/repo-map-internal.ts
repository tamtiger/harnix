import { resolve } from "node:path";
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
import { queryWorkspaceRepoMap, refreshWorkspaceRepoMap } from "src/core/repo-map/workspace.js";
import { buildProjectEventMatrix, buildWorkspaceEventMatrix } from "src/core/repo-map/event-matrix.js";
import { findInitializedProject } from "src/utils/project-discovery.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";
import { compareCodeUnits } from "src/utils/order.js";

import { formatQueryResults, parseRepoMapFormat, type RepoMapQueryFormat } from "src/core/repo-map/compact.js";
import {
  parseRepoMapDepth,
  parseRepoMapLimit,
  parseRepoMapOutlineLimit,
  parseRepoMapPath,
  parseRepoMapSymbol,
  type RepoMapCliOptions,
  validateRepoMapOptions,
} from "src/cli-helpers.js";

export async function runRepoMapCommand(cwd: string, options: RepoMapCliOptions): Promise<unknown> {
  validateRepoMapOptions(options);
  if (options.refresh) {
    if (options.limit !== undefined) throw new Error("--limit is not valid with repo-map --refresh.");
    if (options.workspace !== undefined) {
      const wsPath = typeof options.workspace === "string" ? options.workspace : undefined;
      return refreshWorkspaceRepoMapInternal(cwd, wsPath);
    }
    return refreshRepoMapInternal(cwd);
  }
  if (options.outline !== undefined) {
    const symbol = options.symbol === undefined ? undefined : parseRepoMapSymbol(options.symbol, "--symbol");
    return outlineRepoMapInternal(
      cwd,
      parseRepoMapPath(options.outline, "--outline"),
      parseRepoMapOutlineLimit(options.limit ?? "20"),
      symbol,
    );
  }
  const limit = parseRepoMapLimit(options.limit ?? "20");
  if (options.refs !== undefined) {
    const target = options.path === undefined ? undefined : parseRepoMapPath(options.path, "--path");
    return refsRepoMapInternal(cwd, parseRepoMapSymbol(options.refs, "--refs"), limit, target);
  }
  if (options.tests !== undefined) return testsRepoMapInternal(cwd, parseRepoMapPath(options.tests, "--tests"), limit);
  if (options.impact !== undefined)
    return impactRepoMapInternal(
      cwd,
      parseRepoMapPath(options.impact, "--impact"),
      parseRepoMapDepth(options.depth ?? "2"),
      limit,
    );
  if (options.events) {
    if (options.workspace !== undefined) {
      const wsPath = typeof options.workspace === "string" ? options.workspace : undefined;
      return eventsWorkspaceRepoMapInternal(cwd, wsPath);
    }
    return eventsRepoMapInternal(cwd);
  }
  const format = parseRepoMapFormat(options.format);
  if (options.workspace !== undefined) {
    const wsPath = typeof options.workspace === "string" ? options.workspace : undefined;
    return queryWorkspaceRepoMapInternal(cwd, options.query!, limit, format, wsPath);
  }
  return queryRepoMapInternal(cwd, options.query!, limit, format);
}

export async function eventsWorkspaceRepoMapInternal(cwd: string, workspacePath?: string): Promise<unknown> {
  const root = await resolveWorkspaceRoot(cwd, workspacePath);
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
  return { records: result.map.records.length, scope: "project", skipped: result.skipped, status: "refreshed" };
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
): Promise<unknown> {
  const root = await initializedRoot(cwd);
  await readConfig(await resolveSafeHarnixPath(root, "config.yaml"));
  return impactRepoMap({ root, target, depth, limit });
}

export async function testsRepoMapInternal(cwd: string, target: string, limit: number): Promise<unknown> {
  const root = await initializedRoot(cwd);
  await readConfig(await resolveSafeHarnixPath(root, "config.yaml"));
  return impactRepoMapTests({ limit, root, target });
}

export async function outlineRepoMapInternal(
  cwd: string,
  target: string,
  limit: number,
  symbol?: string,
): Promise<unknown> {
  const root = await initializedRoot(cwd);
  await readConfig(await resolveSafeHarnixPath(root, "config.yaml"));
  return outlineRepoMap({ limit, root, ...(symbol === undefined ? {} : { symbol }), target });
}

export async function refsRepoMapInternal(
  cwd: string,
  symbol: string,
  limit: number,
  target?: string,
): Promise<unknown> {
  const root = await initializedRoot(cwd);
  await readConfig(await resolveSafeHarnixPath(root, "config.yaml"));
  return refsRepoMap({ limit, root, symbol, ...(target === undefined ? {} : { target }) });
}

async function initializedRoot(cwd: string): Promise<string> {
  const project = await findInitializedProject({ cwd });
  if (project.kind !== "ready") throw new Error("Repo map requires an initialized Harnix project.");
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

async function resolveWorkspaceRoot(cwd: string, workspacePath?: string): Promise<string> {
  if (workspacePath !== undefined) {
    return resolve(cwd, workspacePath);
  }
  const project = await findInitializedProject({ cwd });
  return project.kind === "ready" ? project.root : cwd;
}
