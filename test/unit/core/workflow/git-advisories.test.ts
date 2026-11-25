import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { earlyEditAdvisories, staleDraftAdvisories } from "src/core/workflow/git-advisories.js";
import { at, buildTaskV3 } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

const status = (...lines: string[]) => lines.join("\0") + "\0";
const modified = (path: string) => `1 .M N... 100644 100644 100644 aaaa bbbb ${path}`;

function gitRunner(options: { status?: string; log?: string; calls?: string[][] } = {}) {
  return async (_cwd: string, args: readonly string[]) => {
    options.calls?.push([...args]);
    if (args.includes("rev-parse")) return "";
    if (args.includes("log")) return options.log ?? "";
    return options.status ?? "";
  };
}

async function project(files: string[]): Promise<string> {
  const root = await temporaryRepository();
  for (const path of files) {
    await mkdir(join(root, path, ".."), { recursive: true });
    await writeFile(join(root, path), "x\n");
  }
  return root;
}

describe("earlyEditAdvisories", () => {
  it("names the files already changed inside relevantPaths while the task is still planning", async () => {
    const root = await project(["src/a.ts", "src/b.ts", "README.md"]);
    const task = buildTaskV3({ status: "planning", relevantPaths: ["src/**"] });

    const found = await earlyEditAdvisories(
      root,
      task,
      gitRunner({ status: status(modified("src/a.ts"), modified("README.md"), modified(".harnix/tasks/x/task.json")) }),
    );

    expect(found).toHaveLength(1);
    expect(found[0]).toContain("src/a.ts");
    expect(found[0]).toContain("in_progress/implementing");
    expect(found[0]).not.toContain("README.md");
    expect(found[0]).not.toContain(".harnix");
  });

  it("also speaks while the task is ready but not yet in progress", async () => {
    const root = await project(["src/a.ts"]);
    const task = buildTaskV3({ status: "ready", checkpoint: "ready", relevantPaths: ["src/**"] });

    expect(await earlyEditAdvisories(root, task, gitRunner({ status: status(modified("src/a.ts")) }))).toHaveLength(1);
  });

  it("stays silent once the task is in progress, verifying or finished", async () => {
    const root = await project(["src/a.ts"]);
    for (const taskStatus of ["in_progress", "verifying"] as const) {
      const task = buildTaskV3({ status: taskStatus, relevantPaths: ["src/**"] });
      expect(await earlyEditAdvisories(root, task, gitRunner({ status: status(modified("src/a.ts")) }))).toEqual([]);
    }
  });

  it("stays silent for a clean tree, for changes outside relevantPaths and for no relevantPaths", async () => {
    const root = await project(["src/a.ts", "README.md"]);
    const base = { status: "planning" } as const;

    expect(await earlyEditAdvisories(root, buildTaskV3({ ...base, relevantPaths: ["src/**"] }), gitRunner())).toEqual(
      [],
    );
    expect(
      await earlyEditAdvisories(
        root,
        buildTaskV3({ ...base, relevantPaths: ["src/**"] }),
        gitRunner({ status: status(modified("README.md")) }),
      ),
    ).toEqual([]);
    expect(
      await earlyEditAdvisories(
        root,
        buildTaskV3({ ...base, relevantPaths: [] }),
        gitRunner({ status: status(modified("src/a.ts")) }),
      ),
    ).toEqual([]);
  });

  it("stays silent when Git cannot answer", async () => {
    const root = await project(["src/a.ts"]);
    const task = buildTaskV3({ status: "planning", relevantPaths: ["src/**"] });
    const failing = async () => {
      throw new Error("not a git repository");
    };

    expect(await earlyEditAdvisories(root, task, failing)).toEqual([]);
  });

  it("names at most five files and counts the rest", async () => {
    const files = Array.from({ length: 7 }, (_, index) => `src/f${index}.ts`);
    const root = await project(files);
    const task = buildTaskV3({ status: "planning", relevantPaths: ["src/**"] });

    const [found] = await earlyEditAdvisories(root, task, gitRunner({ status: status(...files.map(modified)) }));

    expect(found).toContain("src/f0.ts");
    expect(found).toContain("src/f4.ts");
    expect(found).not.toContain("src/f5.ts");
    expect(found).toContain("+2 more");
  });
});

describe("staleDraftAdvisories", () => {
  const created = at(0);
  const daysLater = (days: number) => new Date(Date.parse(created) + days * 86_400_000).toISOString();

  it("warns when the draft is three or more days old and says how many days", async () => {
    const root = await project(["src/a.ts"]);
    const task = buildTaskV3({ status: "planning", createdAt: created, relevantPaths: ["src/**"] });

    const [found] = await staleDraftAdvisories(root, task, daysLater(5), gitRunner());

    expect(found).toContain("5 day(s)");
    expect(found).toContain("0 commit(s)");
    expect(found).toContain("ready-review");
  });

  it("warns on a fresh draft when a commit touched relevantPaths since it was created", async () => {
    const root = await project(["src/a.ts"]);
    const task = buildTaskV3({ status: "planning", createdAt: created, relevantPaths: ["src/**"] });

    const [found] = await staleDraftAdvisories(root, task, daysLater(0.1), gitRunner({ log: "h1\nh2\n" }));

    expect(found).toContain("2 commit(s)");
    expect(found).toContain("0 day(s)");
  });

  it("stays silent for a fresh draft with no commit on its paths", async () => {
    const root = await project(["src/a.ts"]);
    const task = buildTaskV3({ status: "planning", createdAt: created, relevantPaths: ["src/**"] });

    expect(await staleDraftAdvisories(root, task, daysLater(1), gitRunner())).toEqual([]);
  });

  it("stays silent after planning, without relevantPaths, and when Git cannot answer", async () => {
    const root = await project(["src/a.ts"]);
    const old = daysLater(9);

    expect(
      await staleDraftAdvisories(
        root,
        buildTaskV3({ status: "ready", checkpoint: "ready", createdAt: created, relevantPaths: ["src/**"] }),
        old,
        gitRunner({ log: "h1\n" }),
      ),
    ).toEqual([]);
    expect(
      await staleDraftAdvisories(root, buildTaskV3({ status: "planning", createdAt: created }), old, gitRunner()),
    ).toEqual([]);
    const failing = async () => {
      throw new Error("not a git repository");
    };
    expect(
      await staleDraftAdvisories(
        root,
        buildTaskV3({ status: "planning", createdAt: created, relevantPaths: ["src/**"] }),
        old,
        failing,
      ),
    ).toEqual([]);
  });

  it("gives Git one pathspec per brace alternative, since a pathspec glob does not know braces", async () => {
    const root = await project(["src/a.ts"]);
    const calls: string[][] = [];
    const task = buildTaskV3({ status: "planning", createdAt: created, relevantPaths: ["src/**/*.{ts,js}"] });

    await staleDraftAdvisories(root, task, daysLater(0.1), gitRunner({ calls }));

    const log = calls.find((args) => args.includes("log"));
    expect(log).toContain(":(glob)src/**/*.ts");
    expect(log).toContain(":(glob)src/**/*.js");
    expect(log!.some((arg) => arg.includes("{"))).toBe(false);
  });

  it("only reads: git log with --since and glob pathspecs, never a write command", async () => {
    const root = await project(["src/a.ts"]);
    const calls: string[][] = [];
    const task = buildTaskV3({ status: "planning", createdAt: created, relevantPaths: ["src/**", "!src/skip.ts"] });

    await staleDraftAdvisories(root, task, daysLater(0.1), gitRunner({ calls }));

    const log = calls.find((args) => args.includes("log"));
    expect(log).toBeDefined();
    expect(log!.some((arg) => arg.startsWith("--since="))).toBe(true);
    expect(log).toContain(":(glob)src/**");
    expect(log!.join(" ")).not.toContain("skip.ts");
    for (const args of calls) expect(["status", "log", "rev-parse"].some((verb) => args.includes(verb))).toBe(true);
  });
});
