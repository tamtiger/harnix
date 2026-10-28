import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rename } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { runCli } from "src/cli-program.js";
import { buildEvidence } from "test/support/builders.js";
import { output } from "test/support/integration-fixtures.js";
import { taskMonth } from "test/support/task-paths.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { implementingTaskV3 } from "test/support/workflow-fixtures.js";

const originalCwd = process.cwd();
const originalExitCode = process.exitCode;
const fixture = useTemporaryRepositories("harnix-rejected-writes-");
afterEach(() => {
  process.chdir(originalCwd);
  process.exitCode = originalExitCode;
  vi.restoreAllMocks();
});

interface Run {
  code: number;
  err: string;
  out: string;
}

async function run(argv: string[], input?: unknown): Promise<Run> {
  const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
  const options = input === undefined ? {} : { workflowInput: async () => JSON.stringify(input) };
  const code = await runCli(["node", "harnix", "workflow", ...argv], options);
  const result = { code, err: output(stderr.mock.calls), out: output(stdout.mock.calls) };
  stdout.mockRestore();
  stderr.mockRestore();
  return result;
}

/** Every file below `.harnix` as `relative/path sha256`, sorted. */
async function treeHash(root: string): Promise<string[]> {
  const base = join(root, ".harnix");
  const lines: string[] = [];
  const walk = async (directory: string, prefix: string): Promise<void> => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const relative = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
      if (entry.isDirectory()) await walk(join(directory, entry.name), relative);
      else {
        const digest = createHash("sha256")
          .update(await readFile(join(directory, entry.name)))
          .digest("hex");
        lines.push(`${relative} ${digest}`);
      }
    }
  };
  await walk(base, "");
  return lines.sort();
}

interface RejectedCase {
  name: string;
  expected: RegExp;
  /** Prepares the project and returns the write to attempt; the tree is hashed after setup. */
  prepare: (root: string) => Promise<{ argv: string[]; input?: unknown }>;
}

const cases: RejectedCase[] = [
  {
    name: "an invalid transition",
    expected: /Illegal task transition in_progress -> planning/u,
    prepare: async (root) => {
      await implementingTaskV3(root);
      return { argv: ["--transition", "planning/planning"] };
    },
  },
  {
    name: "a future-dated evidence save",
    expected: /recorded in the future/u,
    prepare: async (root) => {
      const task = await implementingTaskV3(root);
      const future = new Date(Date.now() + 3_600_000).toISOString();
      const evidence = [buildEvidence({ id: "ev-future", recordedAt: future })];
      return { argv: ["--save"], input: { task: { ...task, evidence } } };
    },
  },
  {
    name: "a tripped circuit breaker",
    expected: /failed twice in a row/u,
    prepare: async (root) => {
      await implementingTaskV3(root);
      process.chdir(root);
      for (const summary of ["first failure", "second failure"]) {
        const failed = await run([
          "--evidence",
          "--check",
          "check",
          "--result",
          "fail",
          "--exit-code",
          "1",
          "--summary",
          summary,
        ]);
        expect(failed.code).toBe(0);
      }
      return {
        argv: ["--evidence", "--check", "check", "--result", "pass", "--exit-code", "0", "--summary", "third try"],
      };
    },
  },
  {
    name: "a mojibake save",
    expected: /wrong text encoding.*Nothing was saved/su,
    prepare: async (root) => {
      const task = await implementingTaskV3(root);
      return { argv: ["--save"], input: { task: { ...task, goal: "Kiá»ƒm tra tiáº¿ng Viá»‡t" } } };
    },
  },
  {
    name: "an evidence write to an archived task",
    expected: /archived and read-only.*archive --restore/su,
    prepare: async (root) => {
      const task = await implementingTaskV3(root);
      // `harnix archive` only moves finished tasks, so an unfinished task in the archive is a hand-made move.
      const month = taskMonth(task.id);
      const archived = join(root, ".harnix", "tasks", "_archive", month);
      await mkdir(archived, { recursive: true });
      await rename(join(root, ".harnix", "tasks", month, task.id), join(archived, task.id));
      return { argv: ["--evidence", "--check", "check", "--result", "pass", "--exit-code", "0", "--summary", "ok"] };
    },
  },
];

describe.sequential("rejected workflow writes", () => {
  it.each(cases)("should_leave_the_harnix_tree_byte_identical_when_$name_is_rejected", async (rejected) => {
    const root = await fixture();
    const attempt = await rejected.prepare(root);
    process.chdir(root);
    const before = await treeHash(root);

    const result = await run(attempt.argv, attempt.input);

    expect(result.code).not.toBe(0);
    expect(result.err).toMatch(rejected.expected);
    expect(await treeHash(root)).toEqual(before);
  });
});
