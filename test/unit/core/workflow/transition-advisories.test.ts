import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { transitionAdvisories } from "src/core/workflow/transition-advisories.js";
import { at, buildCheck, buildCriterion, buildEvidence, buildTaskV3 } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

const status = (...lines: string[]) => lines.join("\0") + "\0";
const modified = (path: string) => `1 .M N... 100644 100644 100644 aaaa bbbb ${path}`;
const runner =
  (output: string, log = "") =>
  async (_cwd: string, args: readonly string[]) =>
    args.includes("rev-parse") ? "" : args.includes("log") ? log : output;

async function project(): Promise<string> {
  const root = await temporaryRepository();
  await mkdir(join(root, "src"), { recursive: true });
  await writeFile(join(root, "src/a.ts"), "x\n");
  return root;
}

const later = new Date(Date.parse(at(0)) + 10 * 86_400_000).toISOString();

describe("transitionAdvisories", () => {
  it("combines the early-edit and stale-draft advisories for the ready target", async () => {
    const root = await project();
    const task = buildTaskV3({ status: "planning", createdAt: at(0), relevantPaths: ["src/**"] });

    const found = await transitionAdvisories(root, task, "ready", "ready", later, runner(status(modified("src/a.ts"))));

    expect(found).toHaveLength(2);
    expect(found.join("\n")).toContain("src/a.ts");
    expect(found.join("\n")).toContain("10 day(s)");
  });

  it("gives only the early-edit advisory for the in_progress/implementing target", async () => {
    const root = await project();
    const task = buildTaskV3({ status: "ready", checkpoint: "ready", createdAt: at(0), relevantPaths: ["src/**"] });

    const found = await transitionAdvisories(
      root,
      task,
      "in_progress",
      "implementing",
      later,
      runner(status(modified("src/a.ts"))),
    );

    expect(found).toHaveLength(1);
    expect(found[0]).toContain("src/a.ts");
  });

  it("gives the evidence-mode advisory for the verifying/finishing target and nothing from Git", async () => {
    const root = await project();
    const task = buildTaskV3({
      status: "verifying",
      checkpoint: "verifying",
      acceptanceCriteria: [buildCriterion({ id: "ac-1", text: "The page shows the total", status: "met" })],
      validationPlan: [buildCheck({ id: "chk-1", criterionIds: ["ac-1"] })],
      evidence: [buildEvidence({ id: "ev-1", checkId: "chk-1", summary: "mode: code-only" })],
      relevantPaths: ["src/**"],
    });

    const found = await transitionAdvisories(
      root,
      task,
      "verifying",
      "finishing",
      later,
      runner(status(modified("src/a.ts"))),
    );

    expect(found).toHaveLength(1);
    expect(found[0]).toContain("code-only");
  });

  it("is empty for every other target", async () => {
    const root = await project();
    const task = buildTaskV3({ status: "planning", createdAt: at(0), relevantPaths: ["src/**"] });

    expect(
      await transitionAdvisories(root, task, "verifying", "verifying", later, runner(status(modified("src/a.ts")))),
    ).toEqual([]);
    expect(
      await transitionAdvisories(root, task, "blocked", "blocked", later, runner(status(modified("src/a.ts")))),
    ).toEqual([]);
  });
});
