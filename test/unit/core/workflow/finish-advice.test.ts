import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { finishCommitAdvice } from "src/core/workflow/finish-advice.js";
import { buildTaskV3 } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

const status = (...lines: string[]) => lines.join("\0") + "\0";
const modified = (path: string) => `1 .M N... 100644 100644 100644 aaaa bbbb ${path}`;
const runner = (output: string) => async (_cwd: string, args: readonly string[]) =>
  args.includes("rev-parse") ? "" : output;

async function project(files: string[]): Promise<string> {
  const root = await temporaryRepository();
  for (const path of files) {
    await mkdir(join(root, path, ".."), { recursive: true });
    await writeFile(join(root, path), "x\n");
  }
  return root;
}

describe("finishCommitAdvice", () => {
  it("suggests the task title as the commit message and lists changed files outside relevantPaths", async () => {
    const root = await project(["src/a.ts", "README.md"]);
    const task = buildTaskV3({ title: "Sửa lỗi hint", relevantPaths: ["src/**"] });

    const advice = await finishCommitAdvice(
      root,
      task,
      runner(status(modified("src/a.ts"), modified("README.md"), modified(".harnix/tasks/x/task.json"))),
    );

    expect(advice.suggestedMessage).toBe("Sửa lỗi hint");
    expect(advice.outsidePaths).toEqual(["README.md"]);
  });

  it("does not report a deleted file as outside, because it can no longer be matched against relevantPaths", async () => {
    const root = await project(["src/a.ts", "README.md"]);
    const task = buildTaskV3({ relevantPaths: ["src/**"] });

    const advice = await finishCommitAdvice(root, task, runner(status(modified("src/gone.ts"), modified("README.md"))));

    expect(advice.outsidePaths).toEqual(["README.md"]);
  });

  it("reports no outside files when everything changed is inside relevantPaths", async () => {
    const root = await project(["src/a.ts"]);
    const task = buildTaskV3({ relevantPaths: ["src/**"] });

    const advice = await finishCommitAdvice(root, task, runner(status(modified("src/a.ts"))));

    expect(advice.outsidePaths).toBeUndefined();
  });

  it("skips the outside check when the task declares no relevantPaths or Git cannot answer", async () => {
    const root = await project(["src/a.ts", "README.md"]);

    const noPaths = await finishCommitAdvice(
      root,
      buildTaskV3({ relevantPaths: [] }),
      runner(status(modified("README.md"))),
    );
    const noGit = await finishCommitAdvice(root, buildTaskV3({ relevantPaths: ["src/**"] }), async () =>
      Promise.reject(new Error("not a repository")),
    );

    expect(noPaths.outsidePaths).toBeUndefined();
    expect(noGit.outsidePaths).toBeUndefined();
  });

  it("lists at most ten outside files in path order", async () => {
    const files = Array.from({ length: 12 }, (_, index) => `docs/f${String(index).padStart(2, "0")}.md`);
    const root = await project(["src/a.ts", ...files]);
    const task = buildTaskV3({ relevantPaths: ["src/**"] });

    const advice = await finishCommitAdvice(root, task, runner(status(...files.map(modified))));

    expect(advice.outsidePaths).toEqual(files.slice(0, 10));
  });
});
