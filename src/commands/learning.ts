import { readConfig } from "src/core/config/config.js";
import { learnedPathPrefixes } from "src/core/journal/learned-blocks.js";
import { learnedSpecStats, type LearnedSpecStats } from "src/core/journal/learned-spec.js";
import { effectiveLearningStatus, type LearningStatus } from "src/core/journal/learning.js";
import { promoteLearning, retireLearning } from "src/core/journal/learned-promote.js";
import { findLowValueLearning, pruneLearning, type PruneMatch } from "src/core/journal/learning-prune.js";
import { reviewLearning } from "src/core/journal/learning-review.js";
import { analyzeLearningStatement } from "src/core/journal/learning-safety.js";
import { similarLearning, type SimilarLearning } from "src/core/journal/learning-similarity.js";
import { createSourcePathsLoader } from "src/core/journal/learning-sources.js";
import { readLearningStates } from "src/core/journal/learning-store.js";
import { currentInstant, journalFilePath } from "src/core/workflow/support.js";
import { compareCodeUnits } from "src/utils/order.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";
import { findInitializedProject } from "src/utils/project-discovery.js";

export const LEARNING_STATUSES = ["draft", "candidate", "approved", "promoted", "rejected", "archived"] as const;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MAX_LISTED_STATEMENT_CHARACTERS = 300;
const MAX_BULK_IDS = 100;
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u;

export interface LearningCommandOptions {
  status?: string | undefined;
  limit?: string | undefined;
  reject?: string | undefined;
  promote?: string | undefined;
  retire?: string | undefined;
  prune?: boolean | undefined;
  apply?: boolean | undefined;
  reason?: string | undefined;
}

export interface LearningListItem {
  id: string;
  status: LearningStatus;
  sources: number;
  recordedAt: string;
  /** Risk kinds found in the statement; a statement with one cannot be promoted. */
  findings: string[];
  /** Other live or promoted notes that read alike (id and token similarity); only a hint, nothing merges them. */
  similar: SimilarLearning[];
  /** Untrusted project text, cut to a fixed length; render it only as a JSON string. */
  statement: string;
}

export type LearningCommandResult =
  | { generator: "harnix"; schemaVersion: 1; action: "list"; items: LearningListItem[]; spec: LearnedSpecStats }
  | {
      generator: "harnix";
      schemaVersion: 1;
      action: "prune";
      applied: boolean;
      matches: PruneMatch[];
      rejected: string[];
      hint?: string;
    }
  | ({ generator: "harnix"; schemaVersion: 1; action: "reject" | "promote" | "retire"; id: string } & Record<
      string,
      unknown
    >);

type Action = "reject" | "promote" | "retire";

function splitIds(value: string): string[] {
  return [...new Set(value.split(",").map((id) => id.trim()))].filter((id) => id !== "");
}

function chosenAction(options: LearningCommandOptions): { action: Action; id: string } | undefined {
  const chosen = (["reject", "promote", "retire"] as const).flatMap((action) => {
    const id = options[action];
    return id === undefined ? [] : [{ action, id }];
  });
  if (chosen.length + (options.prune === true ? 1 : 0) > 1)
    throw new Error("Use only one of --reject, --promote, --retire and --prune.");
  const [one] = chosen;
  if (one === undefined) return undefined;
  const ids = splitIds(one.id);
  if (ids.length > 1 && one.action === "promote") throw new Error("--promote takes exactly one id.");
  if (ids.length > MAX_BULK_IDS) throw new Error(`At most ${MAX_BULK_IDS} ids can be given at once.`);
  const bad = ids.find((id) => !ID_PATTERN.test(id));
  if (bad !== undefined || ids.length === 0)
    throw new Error(`Learning id ${JSON.stringify(bad ?? one.id)} is invalid.`);
  // Trimmed and de-duplicated, so "obs-a," or " obs-a " names the learning obs-a.
  return { action: one.action, id: ids.join(",") };
}

function validate(options: LearningCommandOptions): { action: Action; id: string } | undefined {
  const picked = chosenAction(options);
  const pruning = options.prune === true;
  if (options.apply === true && picked?.action !== "promote" && !pruning)
    throw new Error("--apply only goes with --promote or --prune.");
  if (options.reason !== undefined && picked?.action !== "reject") throw new Error("--reason only goes with --reject.");
  if ((picked !== undefined || pruning) && (options.status !== undefined || options.limit !== undefined))
    throw new Error("--status and --limit belong to the listing; they cannot be combined with an action.");
  if (options.status !== undefined && !(LEARNING_STATUSES as readonly string[]).includes(options.status))
    throw new Error(`--status must be one of ${LEARNING_STATUSES.join(", ")}.`);
  return picked;
}

function parseLimit(value: string | undefined): number {
  if (value === undefined) return DEFAULT_LIMIT;
  if (!/^\d+$/u.test(value) || Number(value) < 1 || Number(value) > MAX_LIMIT)
    throw new Error(`--limit must be an integer between 1 and ${MAX_LIMIT}.`);
  return Number(value);
}

function cut(statement: string): string {
  const characters = Array.from(statement.replace(/\s+/gu, " ").trim());
  return characters.length <= MAX_LISTED_STATEMENT_CHARACTERS
    ? characters.join("")
    : `${characters.slice(0, MAX_LISTED_STATEMENT_CHARACTERS - 1).join("")}…`;
}

/** `harnix learning`: list project learning, or reject, promote (with `--apply`) or retire one by id. */
export async function runLearning(cwd: string, options: LearningCommandOptions): Promise<LearningCommandResult> {
  const picked = validate(options);
  const limit = parseLimit(options.limit);
  const project = await findInitializedProject({ cwd });
  if (project.kind !== "ready") throw new Error("Learning requires an initialized Harnix project.");
  const root = project.root;
  const harnixRoot = await resolveSafeHarnixPath(root);
  const config = await readConfig(await resolveSafeHarnixPath(root, "config.yaml"));
  const journalRoot = await resolveSafeHarnixPath(root, `workspace/${config.developer}/journal`);
  const now = await currentInstant(root, undefined);
  const base = {
    projectRoot: root,
    journalRoot,
    journalPath: await journalFilePath(root, config, now),
    developer: config.developer,
    now,
  };
  const head = { generator: "harnix", schemaVersion: 1 } as const;
  if (options.prune === true) return { ...head, ...(await prune(journalRoot, base, options.apply === true)) };
  if (picked === undefined) return { ...head, ...(await list(root, journalRoot, now, options.status, limit)) };
  const ids = splitIds(picked.id);
  if (ids.length > 1 && picked.action !== "promote")
    return { ...head, ...(await bulk(base, picked.action, ids, options.reason)) };
  const input = { ...base, id: picked.id };
  if (picked.action === "reject") {
    const { candidate } = await reviewLearning({ ...input, action: "reject", reason: options.reason });
    return { ...head, action: "reject", id: picked.id, status: candidate.status };
  }
  if (picked.action === "retire") {
    const retired = await retireLearning(input);
    return { ...head, action: "retire", id: picked.id, status: "archived", ...retired };
  }
  const states = await readLearningStates(journalRoot);
  const sources = states.get(picked.id)?.candidate.sourceTaskIds ?? [];
  const paths = learnedPathPrefixes(await createSourcePathsLoader(harnixRoot)(sources));
  const promoted = await promoteLearning({ ...input, paths, apply: options.apply === true });
  const { content, ...summary } = promoted;
  return {
    ...head,
    action: "promote",
    id: picked.id,
    ...summary,
    status: promoted.applied ? "promoted" : "unchanged",
    proposal: content,
    similar: similarLearning(states, picked.id),
    ...(promoted.applied ? {} : { hint: "Run again with --apply to write the rule." }),
  };
}

async function list(
  root: string,
  journalRoot: string,
  now: string,
  status: string | undefined,
  limit: number,
): Promise<{ action: "list"; items: LearningListItem[]; spec: LearnedSpecStats }> {
  const items: LearningListItem[] = [];
  const states = await readLearningStates(journalRoot);
  for (const { entry, candidate } of states.values()) {
    const effective = effectiveLearningStatus(candidate.status, entry.recordedAt, Date.parse(now));
    if (status !== undefined && effective !== status) continue;
    items.push({
      id: candidate.id,
      status: effective,
      sources: candidate.sourceTaskIds.length,
      recordedAt: entry.recordedAt,
      findings: analyzeLearningStatement(candidate.statement).findings.filter((kind) => kind !== "url-like"),
      similar: [],
      statement: cut(candidate.statement),
    });
  }
  items.sort(
    (left, right) => compareCodeUnits(right.recordedAt, left.recordedAt) || compareCodeUnits(left.id, right.id),
  );
  // Similarity is the costly part, so it is computed only for the entries that are returned.
  const shown = items.slice(0, limit).map((item) => ({ ...item, similar: similarLearning(states, item.id) }));
  return { action: "list", items: shown, spec: await learnedSpecStats(root) };
}

async function prune(
  journalRoot: string,
  base: { journalPath: string; developer: string; now: string },
  apply: boolean,
): Promise<{ action: "prune"; applied: boolean; matches: PruneMatch[]; rejected: string[]; hint?: string }> {
  const found = await findLowValueLearning(journalRoot, base.now);
  const matches = found.map((match) => ({ ...match, statement: cut(match.statement) }));
  if (!apply) {
    return {
      action: "prune",
      applied: false,
      matches,
      rejected: [],
      ...(matches.length === 0 ? {} : { hint: "Run again with --apply to reject these." }),
    };
  }
  return { action: "prune", applied: true, matches, rejected: await pruneLearning({ journalRoot, ...base }, found) };
}

/** Rejects or retires several notes in turn; an id that cannot be handled is reported and the rest still go through. */
async function bulk(
  base: { projectRoot: string; journalRoot: string; journalPath: string; developer: string; now: string },
  action: "reject" | "retire",
  ids: string[],
  reason: string | undefined,
): Promise<{
  action: "reject" | "retire";
  id: string;
  ids: string[];
  status: string;
  failed: { id: string; message: string }[];
}> {
  const done: string[] = [];
  const failed: { id: string; message: string }[] = [];
  for (const id of ids) {
    try {
      if (action === "reject") await reviewLearning({ ...base, id, action: "reject", reason });
      else await retireLearning({ ...base, id });
      done.push(id);
    } catch (error) {
      failed.push({ id, message: error instanceof Error ? error.message : String(error) });
    }
  }
  return { action, id: ids.join(","), ids: done, status: action === "reject" ? "rejected" : "archived", failed };
}
