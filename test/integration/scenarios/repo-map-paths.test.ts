import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { runCli } from "src/cli-program.js";
import { initializeProject } from "src/commands/init.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-repo-map-paths-");
const originalCwd = process.cwd();
afterEach(() => {
  process.chdir(originalCwd);
  vi.restoreAllMocks();
});

async function project(): Promise<string> {
  const root = await temporaryRepository();
  await mkdir(join(root, "pay", "src"), { recursive: true });
  await writeFile(join(root, "pay", "src", "svc.ts"), "export function run(): number {\n  return 1;\n}\n");
  await initializeProject({ developer: "tam", root, yes: true });
  return root;
}

async function run(cwd: string, args: string[]): Promise<Record<string, unknown>> {
  process.chdir(cwd);
  const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  vi.spyOn(process.stderr, "write").mockImplementation(() => true);
  await runCli(["node", "harnix", "repo-map", ...args]);
  const text = stdout.mock.calls.map((call) => String(call[0])).join("");
  stdout.mockRestore();
  return JSON.parse(text) as Record<string, unknown>;
}

describe.sequential("repo-map paths typed from a sub-directory", () => {
  it("reads a path relative to the current directory as a path relative to the project root", async () => {
    const root = await project();
    await run(root, ["--refresh"]);

    const outline = await run(join(root, "pay", "src"), ["--outline", "svc.ts", "--symbol", "run", "--body"]);
    const impact = await run(join(root, "pay"), ["--impact", "src/svc.ts"]);
    const tests = await run(join(root, "pay", "src"), ["--tests", "svc.ts"]);

    expect(outline).toMatchObject({ status: "ready", target: "pay/src/svc.ts" });
    expect(impact).toMatchObject({ status: "ready", target: "pay/src/svc.ts" });
    expect(tests).toMatchObject({ status: "ready", target: "pay/src/svc.ts" });
  });

  it("answers not-found with the nearest mapped path, also with --body, from the root and from a sub-directory", async () => {
    const root = await project();
    await run(root, ["--refresh"]);

    for (const cwd of [root, join(root, "pay")]) {
      const plain = await run(cwd, ["--outline", "src/gone/svc.ts"]);
      const body = await run(cwd, ["--outline", "src/gone/svc.ts", "--symbol", "run", "--body"]);
      for (const result of [plain, body]) {
        expect(result).toMatchObject({ status: "not-found", suggestions: ["pay/src/svc.ts"] });
        expect(result).not.toHaveProperty("hint");
      }
    }
  });

  it("does not let a sub-directory path reach outside the project", async () => {
    const root = await project();
    await run(root, ["--refresh"]);

    const result = await run(join(root, "pay", "src"), ["--outline", "../../../outside.ts"]);

    expect(result.status).not.toBe("ready");
  });
});
