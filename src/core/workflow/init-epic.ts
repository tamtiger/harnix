import { readProjectTimezone } from "src/core/config/config.js";
import type { EpicRecord } from "src/core/epics/epic.js";
import type { TaskRecord } from "src/core/tasks/task.js";
import { formatInstant, idPrefix } from "src/utils/clock.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";
import { flagIssueError } from "./flag-issues.js";
import { asciiFold, slugOrIssue } from "./init-issues.js";
import { prepareInitTask, type PreparedInitTask } from "./init-task.js";
import { saveWorkflow } from "./save.js";
import { currentInstant } from "./support.js";

export interface InitEpicOptions {
  title: string | undefined;
  slug?: string | undefined;
  goal?: string | undefined;
  /** One `<title>|<english-slug>` per member task, in run order. */
  members: string[] | undefined;
  command?: string | undefined;
  input?: string[] | undefined;
  dryRun?: boolean | undefined;
  injectedNow?: string | undefined;
}

export interface InitEpicResult {
  dryRun: boolean;
  epic: { id: string; title: string; goal: string };
  members: { id: string; title: string; checks: string[] }[];
  /** The first member, now active; absent for a dry run. */
  task?: TaskRecord;
}

interface MemberSpec {
  title: string;
  slug: string;
}

const EXAMPLE =
  'harnix workflow --init-epic --title "<epic title>" --slug <english-slug> --member "<title A>|<slug-a>" --member "<title B>|<slug-b>"';

/** Every problem of the `--member` specs and the epic title at once, so one call fixes them all. */
function parseMembers(raw: readonly string[]): { members: MemberSpec[]; issues: string[] } {
  const issues: string[] = [];
  const members: MemberSpec[] = [];
  for (const spec of raw) {
    const cut = spec.lastIndexOf("|");
    const title = (cut < 0 ? spec : spec.slice(0, cut)).trim();
    const slug = cut < 0 ? undefined : spec.slice(cut + 1).trim();
    if (title === "" || slug === undefined || slug === "") {
      issues.push(`--member "${spec}" must be "<title>|<english-slug>" with both parts.`);
      continue;
    }
    const resolved = slugOrIssue(title, slug);
    if (resolved.slug === undefined) issues.push(`--member "${title}": ${resolved.issue ?? "invalid slug."}`);
    else members.push({ title, slug: resolved.slug });
  }
  const seen = new Set<string>();
  for (const { slug } of members) {
    if (seen.has(slug)) issues.push(`--member slug ${slug} is used twice; each member needs its own slug.`);
    seen.add(slug);
  }
  return { members, issues };
}

function checkParams(options: InitEpicOptions) {
  const issues: string[] = [];
  const title = options.title?.trim() ?? "";
  if (title === "") issues.push("workflow --init-epic requires a non-empty --title.");
  const epicSlug = slugOrIssue(title, options.slug);
  if (title !== "" && epicSlug.slug === undefined) issues.push(epicSlug.issue ?? "invalid --slug.");
  const rawMembers = options.members ?? [];
  if (rawMembers.length < 2)
    issues.push('an epic groups at least 2 tasks: pass --member "<title>|<english-slug>" twice or more.');
  const parsed = parseMembers(rawMembers);
  issues.push(...parsed.issues);
  if (issues.length > 0) {
    const hintSlug = epicSlug.slug ?? (asciiFold(title) || "epic");
    throw flagIssueError("workflow --init-epic", issues, EXAMPLE.replace("<english-slug>", hintSlug));
  }
  return { title, slug: epicSlug.slug as string, members: parsed.members };
}

/**
 * Creates an epic and all its member tasks in one save: IDs take the clock prefix, one second apart so the members run
 * in the order given, the first member becomes active and the rest stay in planning. A dry run only reports the plan.
 */
export async function initEpicWorkflow(root: string, options: InitEpicOptions): Promise<InitEpicResult> {
  const { title, slug, members } = checkParams(options);
  const goal = options.goal?.trim() || title;
  const now = await currentInstant(root, options.injectedNow);
  const timezone = await readProjectTimezone(await resolveSafeHarnixPath(root));
  const baseMs = Date.parse(now);
  const epicId = `${idPrefix(baseMs, timezone)}-${slug}`;
  const prepared: PreparedInitTask[] = [];
  for (const [index, member] of members.entries()) {
    prepared.push(
      await prepareInitTask(root, {
        title: member.title,
        slug: member.slug,
        command: options.command,
        input: options.input,
        epicPending: epicId,
        injectedNow: formatInstant(baseMs + (index + 1) * 1000, timezone),
      }),
    );
  }
  const epic: EpicRecord = {
    generator: "harnix",
    schemaVersion: 1,
    id: epicId,
    title,
    goal,
    createdAt: now,
    updatedAt: now,
  };
  const summary = {
    epic: { id: epicId, title, goal },
    members: prepared.map(({ candidate }) => ({
      id: candidate.id,
      title: candidate.title,
      checks: candidate.validationPlan.map(({ id }) => id),
    })),
  };
  if (options.dryRun === true) return { dryRun: true, ...summary };
  const [first, ...rest] = prepared as [PreparedInitTask, ...PreparedInitTask[]];
  const task = await saveWorkflow(root, {
    epic,
    task: first.candidate,
    epicMembers: rest.map(({ candidate }) => candidate),
    ...(first.artifacts ? { artifacts: first.artifacts } : {}),
  });
  return { dryRun: false, ...summary, task };
}
