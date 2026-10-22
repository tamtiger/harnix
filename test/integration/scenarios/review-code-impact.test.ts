import { execFileSync } from "node:child_process";
import { readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { runCli } from "src/cli-program.js";
import { initializeProject } from "src/commands/init.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-review-impact-");
const originalCwd = process.cwd();
afterEach(() => {
  process.chdir(originalCwd);
  vi.restoreAllMocks();
});

function git(cwd: string, ...args: string[]): void {
  execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.com", "-c", "commit.gpgsign=false", ...args], {
    cwd,
    stdio: "ignore",
  });
}

async function reviewOf(root: string): Promise<string> {
  const tasks = join(root, ".harnix", "tasks");
  const id = (await readdir(tasks)).find((name) => /^\d{8}-/u.test(name))!;
  return readFile(join(tasks, id, "review.md"), "utf8");
}

async function startTask(): Promise<void> {
  vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  vi.spyOn(process.stderr, "write").mockImplementation(() => true);
  const run = (...args: string[]): Promise<number> => runCli(["node", "harnix", "workflow", ...args]);
  await expect(
    run(
      "--init",
      "--title",
      "Impact",
      "--slug",
      "impact",
      "--command",
      "node --version",
      "--input",
      "src/**",
      "--brief",
    ),
  ).resolves.toBe(0);
  await expect(run("--transition", "ready/ready", "--brief")).resolves.toBe(0);
  await expect(run("--transition", "in_progress/implementing", "--brief")).resolves.toBe(0);
}

describe.sequential("review.md Code impact in a real Git repository", () => {
  it("lists modified, added and deleted files with their line counts", { timeout: 60_000 }, async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    await writeFile(join(root, "keep.txt"), "one\ntwo\n");
    await writeFile(join(root, "gone.txt"), "bye\n");
    git(root, "init", "-b", "main");
    git(root, "add", ".");
    git(root, "commit", "-m", "base");
    await writeFile(join(root, "keep.txt"), "one\ntwo\nthree\n");
    await writeFile(join(root, "fresh.txt"), "new\n");
    await rm(join(root, "gone.txt"));
    process.chdir(root);

    await startTask();

    const review = await reviewOf(root);
    expect(review).toContain("## Code impact");
    expect(review).toContain("| `keep.txt` | modified | +1 / -0 |");
    expect(review).toContain("| `fresh.txt` | added | - |");
    expect(review).toContain("| `gone.txt` | deleted | +0 / -1 |");
    expect(review).not.toContain(".harnix/");
    expect(review).not.toContain(root);
  });

  it("omits the section outside Git", { timeout: 60_000 }, async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    process.chdir(root);

    await startTask();

    expect(await reviewOf(root)).not.toContain("## Code impact");
  });
});
