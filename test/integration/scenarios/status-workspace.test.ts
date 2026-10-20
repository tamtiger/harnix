import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { runCli } from "src/cli-program.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-status-workspace-");
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

async function repository(root: string, name: string): Promise<string> {
  const path = join(root, name);
  await mkdir(path, { recursive: true });
  git(path, "init", "-b", "main");
  await writeFile(join(path, "file.txt"), "one\n");
  git(path, "add", ".");
  git(path, "commit", "-m", "first");
  return path;
}

describe("harnix status --workspace", () => {
  it("prints a read-only Git table of the sub-repositories", { timeout: 60_000 }, async () => {
    const root = await temporaryRepository();
    await repository(root, "clean-repo");
    const dirty = await repository(root, "dirty-repo");
    await writeFile(join(dirty, "untracked.txt"), "x\n");
    process.chdir(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "status", "--workspace"])).resolves.toBe(0);

    const output = JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join("")) as {
      members: Array<Record<string, unknown>>;
      scope: string;
    };
    expect(output.scope).toBe("workspace");
    expect(output.members.map((member) => member.name)).toEqual(["clean-repo", "dirty-repo"]);
    expect(output.members[0]).toMatchObject({ branch: "main", dirty: 0, status: "ok", upstream: null });
    expect(output.members[1]).toMatchObject({ ahead: null, behind: null, branch: "main", dirty: 1, upstream: null });
    expect(JSON.stringify(output)).not.toContain(root);
  });

  it("returns an empty list with a message outside a workspace and rejects incompatible flags", async () => {
    const root = await temporaryRepository();
    process.chdir(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "status", "--workspace"])).resolves.toBe(0);
    expect(JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join(""))).toMatchObject({
      members: [],
      message: expect.stringContaining("No Git repositories"),
    });
    await expect(runCli(["node", "harnix", "status", "--workspace", "--explain"])).resolves.toBe(2);
    await expect(runCli(["node", "harnix", "status", "--workspace", "--summary"])).resolves.toBe(2);
    await expect(runCli(["node", "harnix", "status", "--workspace", "--limit", "3"])).resolves.toBe(2);
  });
});
