import { readConfig } from "src/core/config/config.js";
import { learnedPathPrefixes } from "src/core/journal/learned-blocks.js";
import { learnedSpecStats, type LearnedSpecStats } from "src/core/journal/learned-spec.js";
import { effectiveLearningStatus, type LearningStatus } from "src/core/journal/learning.js";
import { promoteLearning, retireLearning } from "src/core/journal/learned-promote.js";
import { reviewLearning } from "src/core/journal/learning-review.js";
import { analyzeLearningStatement } from "src/core/journal/learning-safety.js";
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
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u;

export interface LearningCommandOptions {
  status?: string | undefined;
  limit?: string | undefined;
  reject?: string | undefined;
  promote?: string | undefined;
  retire?: string | undefined;
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
  /** Untrusted project text, cut to a fixed length; render it only as a JSON string. */
  statement: string;
}

export type LearningCommandResult =
  | { generator: "harnix"; schemaVersion: 1; action: "list"; items: LearningListItem[]; spec: LearnedSpecStats }
  | ({ generator: "harnix"; schemaVersion: 1; action: "reject" | "promote" | "retire"; id: string } & Record<
      string,
      unknown
    >);

type Action = "reject" | "promote" | "retire";

function chosenAction(options: LearningCommandOptions): { action: Action; id: string } | undefined {
  const chosen = (["reject", "promote", "retire"] as const).flatMap((action) => {
    const id = options[action];
    return id === undefined ? [] : [{ action, id }];
  });
  if (chosen.length > 1) throw new Error("Use only one of --reject, --promote and --retire.");
  const [one] = chosen;
  if (one !== undefined && !ID_PATTERN.test(one.id))
    throw new Error(`Learning id ${JSON.stringify(one.id)} is invalid.`);
  return one;
}

function validate(options: LearningCommandOptions): { action: Action; id: string } | undefined {
  const picked = chosenAction(options);
  if (options.apply === true && picked?.action !== "promote") throw new Error("--apply only goes with --promote.");
  if (options.reason !== undefined && picked?.action !== "reject") throw new Error("--reason only goes with --reject.");
  if (picked !== undefined && (options.status !== undefined || options.limit !== undefined))
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
  if (picked === undefined) return { ...head, ...(await list(root, journalRoot, now, options.status, limit)) };
  const input = { ...base, id: picked.id };
  if (picked.action === "reject") {
    const { candidate } = await reviewLearning({ ...input, action: "reject", reason: options.reason });
    return { ...head, action: "reject", id: picked.id, status: candidate.status };
  }
  if (picked.action === "retire") {
    const retired = await retireLearning(input);
    return { ...head, action: "retire", id: picked.id, status: "archived", ...retired };
  }
  const sources = (await readLearningStates(journalRoot)).get(picked.id)?.candidate.sourceTaskIds ?? [];
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
  for (const { entry, candidate } of (await readLearningStates(journalRoot)).values()) {
    const effective = effectiveLearningStatus(candidate.status, entry.recordedAt, Date.parse(now));
    if (status !== undefined && effective !== status) continue;
    items.push({
      id: candidate.id,
      status: effective,
      sources: candidate.sourceTaskIds.length,
      recordedAt: entry.recordedAt,
      findings: analyzeLearningStatement(candidate.statement).findings.filter((kind) => kind !== "url-like"),
      statement: cut(candidate.statement),
    });
  }
  items.sort(
    (left, right) => compareCodeUnits(right.recordedAt, left.recordedAt) || compareCodeUnits(left.id, right.id),
  );
  return { action: "list", items: items.slice(0, limit), spec: await learnedSpecStats(root) };
}
