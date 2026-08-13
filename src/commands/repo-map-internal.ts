import { readConfig } from "../core/config/config.js";
import { resolveActiveTask } from "../core/tasks/task.js";
import { queryRepoMap, refreshRepoMap } from "../core/repo-map/service.js";
import { findInitializedProject } from "../utils/project-discovery.js";
import { resolveSafeHarnixPath } from "../utils/paths.js";

export async function refreshRepoMapInternal(cwd: string): Promise<unknown> {
  const root = await initializedRoot(cwd);
  const result = await refreshRepoMap({ root });
  return { records: result.map.records.length, scope: "project", skipped: result.skipped, status: "refreshed" };
}

export async function queryRepoMapInternal(cwd: string, query: string, limit: number): Promise<unknown> {
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
  return { results: result.results, scope: "project", status: result.status };
}

async function initializedRoot(cwd: string): Promise<string> {
  const project = await findInitializedProject({ cwd });
  if (project.kind !== "ready") throw new Error("Repo map requires an initialized Harnix project.");
  return project.root;
}

function terms(...values: string[]): string[] {
  return [...new Set(values.join(" ").toLocaleLowerCase().match(/[\p{L}\p{N}_-]+/gu) ?? [])].sort((left, right) => left.localeCompare(right));
}
