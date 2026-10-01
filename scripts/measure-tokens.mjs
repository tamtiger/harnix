import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

import { createIsolatedUserEnvironment } from "./isolated-user-home.mjs";

/** Same approximation as `context.tokenApproximation` in `.harnix/config.yaml`. */
export const TOKEN_APPROXIMATION = 4;

export const estimateTokens = (text) => Math.ceil(text.length / TOKEN_APPROXIMATION);

/** Workflow commands that accept `--brief`; each is measured with and without it. */
const BRIEF_LABELS = new Set([
  "save create",
  "transition ready/ready",
  "transition in_progress/implementing",
  "run-check chk-1",
  "criterion ac-1 --met",
  "transition verifying/verifying",
  "transition verifying/finishing",
  "finish",
]);

/** Wraps a runner so every step records its input and output tokens and a failing command aborts the measurement. */
export function createMeter(run) {
  const steps = [];
  return {
    steps,
    step(label, args, input) {
      const result = run(args, input);
      if (result.status !== 0)
        throw new Error(`measure step "${label}" failed (exit ${result.status}): ${result.stderr || result.stdout}`);
      steps.push({
        label,
        inputTokens: input === undefined ? 0 : estimateTokens(input),
        outputTokens: estimateTokens(result.stdout),
      });
      return result.stdout;
    },
  };
}

/** Joins the `--brief` and plain runs of the same commands; a divergence means the two runs are not comparable. */
export function pairSteps(brief, full) {
  if (brief.length !== full.length)
    throw new Error(`brief and full runs differ in length (${brief.length} versus ${full.length}).`);
  return brief.map((step, index) => {
    const other = full[index];
    if (other.label !== step.label) throw new Error(`step ${index} differs: "${step.label}" versus "${other.label}".`);
    return {
      label: step.label,
      brief: { inputTokens: step.inputTokens, outputTokens: step.outputTokens },
      full: { inputTokens: other.inputTokens, outputTokens: other.outputTokens },
    };
  });
}

function buildTask(clock) {
  const id = `${clock.idPrefix}-measure-fixture`;
  return {
    generator: "harnix",
    schemaVersion: 3,
    id,
    title: "Measure fixture",
    mode: "lite",
    status: "planning",
    checkpoint: "planning",
    createdAt: clock.now,
    updatedAt: clock.now,
    goal: "Change one constant in src/a.js and prove it with one focused check so the lifecycle token cost is measured.",
    nonGoals: ["No other behavior changes"],
    acceptanceCriteria: [
      { id: "ac-1", text: "src/a.js exports a equal to 2 and check chk-1 passes.", status: "pending", evidenceIds: [] },
    ],
    relevantPaths: ["src/a.js"],
    relevantSpecs: [],
    evidence: [],
    validationPlan: [
      {
        id: "chk-1",
        description: "Run a node check",
        command: "node -e process.exit(0)",
        criterionIds: ["ac-1"],
        inputs: ["src/**"],
        required: true,
        scope: "full",
      },
    ],
  };
}

/** Runs one Lite lifecycle in a disposable project and home, returning every measured step. */
export async function measureLifecycle({ cli, brief }) {
  const project = await mkdtemp(join(tmpdir(), "harnix-measure-tokens-project-"));
  const home = await mkdtemp(join(tmpdir(), "harnix-measure-tokens-home-"));
  const env = createIsolatedUserEnvironment(home);
  const run = (args, input) => {
    const result = spawnSync(process.execPath, [cli, ...args], {
      cwd: project,
      env,
      input,
      encoding: "utf8",
      windowsHide: true,
    });
    return {
      status: result.status ?? 1,
      stdout: result.stdout ?? "",
      stderr: result.stderr || result.error?.message || "",
    };
  };
  const meter = createMeter(run);
  const flag = brief ? ["--brief"] : [];
  try {
    await mkdir(join(project, "src"), { recursive: true });
    await writeFile(join(project, "package.json"), JSON.stringify({ name: "measure-fixture", private: true }));
    await writeFile(join(project, "src", "a.js"), "export const a = 1;\n");

    meter.step("init", ["init", "--user", "measure"]);
    const skillList = JSON.parse(meter.step("skill list", ["skill"]));
    const skills = {};
    for (const { name } of skillList.skills)
      skills[name] = estimateTokens(meter.step(`skill ${name}`, ["skill", name]));
    const statics = {
      alwaysLoaded: estimateTokens(await readFile(join(project, "AGENTS.md"), "utf8")),
      workflowDoc: estimateTokens(await readFile(join(project, ".harnix", "workflow.md"), "utf8")),
      skills,
    };

    const noTask = meter.step("preflight (no task)", ["workflow", "--preflight"]);
    meter.step("schema", ["workflow", "--schema"]);
    const task = buildTask(JSON.parse(noTask).clock);
    const hook = JSON.stringify({ hook_event_name: "UserPromptSubmit", cwd: project, prompt: "measure" });

    meter.step("save create", ["workflow", "--save", ...flag], JSON.stringify({ task }));
    meter.step("hook context (planning)", ["context", "--platform", "claude"], hook);
    meter.step("preflight (planning)", ["workflow", "--preflight"]);
    meter.step("transition ready/ready", ["workflow", "--transition", "ready/ready", ...flag]);
    meter.step("transition in_progress/implementing", [
      "workflow",
      "--transition",
      "in_progress/implementing",
      ...flag,
    ]);
    meter.step("hook context (in_progress)", ["context", "--platform", "claude"], hook);
    meter.step("inspect", ["workflow", "--inspect"]);
    meter.step("status", ["status"]);
    meter.step("status --explain", ["status", "--explain"]);
    await writeFile(join(project, "src", "a.js"), "export const a = 2;\n");
    meter.step("run-check chk-1", [
      "workflow",
      "--run-check",
      "chk-1",
      ...flag,
      "--",
      process.execPath,
      "-e",
      "process.exit(0)",
    ]);
    meter.step("criterion ac-1 --met", ["workflow", "--criterion", "ac-1", "--met", ...flag]);
    meter.step("transition verifying/verifying", ["workflow", "--transition", "verifying/verifying", ...flag]);
    meter.step("transition verifying/finishing", ["workflow", "--transition", "verifying/finishing", ...flag]);
    meter.step("preflight (finishing)", ["workflow", "--preflight"]);
    meter.step("finish", ["workflow", "--finish", ...flag]);
    return { steps: meter.steps, statics };
  } finally {
    await Promise.all([rm(project, { force: true, recursive: true }), rm(home, { force: true, recursive: true })]);
  }
}

/** Token cost of the packaged guides an agent reads on demand: every markdown file under `directory`. */
export async function measureGuides(directory) {
  const files = [];
  const walk = async (current) => {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.name.endsWith(".md")) files.push(path);
    }
  };
  await walk(directory);
  const tokens = new Map();
  for (const path of files) tokens.set(path, estimateTokens(await readFile(path, "utf8")));
  const of = (...segments) => {
    const value = tokens.get(join(directory, ...segments));
    if (value === undefined) throw new Error(`guide ${segments.join("/")} is missing.`);
    return value;
  };
  const sizes = [...tokens.values()];
  return {
    files: sizes.length,
    totalTokens: sizes.reduce((sum, size) => sum + size, 0),
    maxTokens: Math.max(0, ...sizes),
    // The typical read: the common guide plus one language guide (TypeScript is the reference).
    commonPlusLanguage: of("common.md") + of("languages", "typescript.md"),
  };
}

export function buildReport(brief, full, guides) {
  const tokensOf = (label) => {
    const step = brief.steps.find((candidate) => candidate.label === label);
    if (step === undefined) throw new Error(`missing measured step "${label}".`);
    return step.outputTokens;
  };
  const steps = pairSteps(
    brief.steps.filter((step) => BRIEF_LABELS.has(step.label)),
    full.steps.filter((step) => BRIEF_LABELS.has(step.label)),
  );
  return {
    generator: "harnix",
    tokenApproximation: TOKEN_APPROXIMATION,
    fixture: "disposable-lite-lifecycle",
    ...brief.statics,
    guides,
    preflight: {
      noTask: tokensOf("preflight (no task)"),
      planning: tokensOf("preflight (planning)"),
      finishing: tokensOf("preflight (finishing)"),
    },
    reads: {
      schema: tokensOf("schema"),
      inspect: tokensOf("inspect"),
      status: tokensOf("status"),
      statusExplain: tokensOf("status --explain"),
    },
    hookContext: { planning: tokensOf("hook context (planning)"), inProgress: tokensOf("hook context (in_progress)") },
    steps,
    totals: {
      briefOutputTokens: steps.reduce((sum, step) => sum + step.brief.outputTokens, 0),
      fullOutputTokens: steps.reduce((sum, step) => sum + step.full.outputTokens, 0),
    },
  };
}

async function main() {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const cli = join(root, "dist", "cli.js");
  if (!existsSync(cli)) throw new Error("dist/cli.js is missing; run `pnpm build` before `pnpm measure:tokens`.");
  const brief = await measureLifecycle({ cli, brief: true });
  const full = await measureLifecycle({ cli, brief: false });
  const guides = await measureGuides(join(root, "src", "guides"));
  process.stdout.write(`${JSON.stringify(buildReport(brief, full, guides))}\n`);
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();
