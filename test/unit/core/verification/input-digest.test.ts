import { access, mkdir, readdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildTaskV3 } from "test/support/builders.js";

import { computeInputDigest } from "src/core/verification/input-digest.js";
import type { TaskRecordV3 } from "src/core/tasks/task.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-digest-");
const timestamp = "2026-09-29T09:00:00.000+07:00";

function taskFixture(overrides: Partial<TaskRecordV3> = {}): TaskRecordV3 {
  return buildTaskV3({
    id: "20260929-090000-digest",
    title: "Digest",
    mode: "full",
    status: "in_progress",
    checkpoint: "implementing",
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  });
}

async function fixtureRepository(): Promise<string> {
  const root = await temporaryRepository();
  await mkdir(join(root, "src"), { recursive: true });
  await mkdir(join(root, ".harnix", "tasks", "20260929-090000-digest"), { recursive: true });
  await writeFile(join(root, "src", "a.ts"), "export const a = 1;\n");
  await writeFile(join(root, "src", "b.ts"), "export const b = 2;\n");
  await writeFile(join(root, ".harnix", "tasks", "20260929-090000-digest", "task.json"), "{}\n");
  return root;
}

describe("v3 input digest", () => {
  it("is deterministic, sorted, and free of absolute paths", async () => {
    const root = await fixtureRepository();
    const first = await computeInputDigest(root, taskFixture(), "check");
    const second = await computeInputDigest(root, taskFixture(), "check");

    expect(second).toEqual(first);
    expect(first.schemaVersion).toBe(3);
    expect(first.inputDigest).toMatch(/^[a-f0-9]{64}$/u);
    expect(first.entries.map((entry) => entry.path)).toEqual(["src/a.ts", "src/b.ts"]);
    expect(JSON.stringify(first)).not.toContain(root);
  });

  it("changes when an input file changes", async () => {
    const root = await fixtureRepository();
    const before = await computeInputDigest(root, taskFixture(), "check");
    await writeFile(join(root, "src", "a.ts"), "export const a = 99;\n");

    const after = await computeInputDigest(root, taskFixture(), "check");

    expect(after.inputDigest).not.toBe(before.inputDigest);
  });

  it("changes when the task contract changes but not when review-only fields change", async () => {
    const root = await fixtureRepository();
    const base = await computeInputDigest(root, taskFixture(), "check");
    const annotated = await computeInputDigest(
      root,
      taskFixture({
        decisions: [{ id: "d", text: "t", rationale: "r" }],
        residualRisks: [{ id: "r", text: "t", severity: "low" }],
      }),
      "check",
    );
    const revised = await computeInputDigest(
      root,
      taskFixture({ acceptanceCriteria: [{ id: "ac-one", text: "One, revised", status: "pending", evidenceIds: [] }] }),
      "check",
    );

    expect(annotated.inputDigest).toBe(base.inputDigest);
    expect(revised.taskContractHash).not.toBe(base.taskContractHash);
    expect(revised.inputDigest).not.toBe(base.inputDigest);
  });

  it("ignores the workflow-owned files of the active task even when a glob matches them", async () => {
    const root = await fixtureRepository();
    const task = taskFixture({
      validationPlan: [
        {
          id: "check",
          description: "Unit tests",
          scope: "focused",
          required: true,
          command: "pnpm test",
          criterionIds: ["ac-one"],
          inputs: [".harnix/tasks/**", "src/**"],
        },
      ],
    });
    const directory = join(root, ".harnix", "tasks", task.id);
    const before = await computeInputDigest(root, task, "check");
    await writeFile(join(directory, "task.json"), '{"changed":true}\n');
    await writeFile(join(directory, "review.md"), "# derived\n");
    await writeFile(join(directory, "verification-inputs.json"), "{}\n");

    const after = await computeInputDigest(root, task, "check");

    expect(after.inputDigest).toBe(before.inputDigest);
    expect(after.entries.map((entry) => entry.path)).toEqual(["src/a.ts", "src/b.ts"]);
  });

  it("does not hash prd.md or plan.md unless they are declared inputs", async () => {
    const root = await fixtureRepository();
    const directory = join(root, ".harnix", "tasks", "20260929-090000-digest");
    await writeFile(join(directory, "plan.md"), "- [ ] `A` — step\n");
    const before = await computeInputDigest(root, taskFixture(), "check");
    await writeFile(join(directory, "plan.md"), "- [x] `A` — step\n");

    const after = await computeInputDigest(root, taskFixture(), "check");

    expect(after.inputDigest).toBe(before.inputDigest);
  });

  it("rejects an unknown check and an input pattern that matches nothing", async () => {
    const root = await fixtureRepository();
    const empty = taskFixture({
      validationPlan: [
        {
          id: "check",
          description: "Unit tests",
          scope: "focused",
          required: true,
          command: "pnpm test",
          criterionIds: ["ac-one"],
          inputs: ["missing/**"],
        },
      ],
    });

    await expect(computeInputDigest(root, taskFixture(), "nope")).rejects.toThrow("not declared");
    await expect(computeInputDigest(root, empty, "check")).rejects.toThrow("matched no files");
  });

  it("writes no sidecar or snapshot file", async () => {
    const root = await fixtureRepository();
    await computeInputDigest(root, taskFixture(), "check");

    await expect(
      access(join(root, ".harnix", "tasks", "20260929-090000-digest", "verification-inputs.json")),
    ).rejects.toMatchObject({ code: "ENOENT" });
    expect(await readdir(join(root, ".harnix", "tasks", "20260929-090000-digest"))).toEqual(["task.json"]);
  });

  it("ignores transient build output and harness directories by default even without gitignore", async () => {
    const root = await fixtureRepository();
    await mkdir(join(root, "bin"), { recursive: true });
    await mkdir(join(root, "obj"), { recursive: true });
    await writeFile(join(root, "bin", "app.dll"), "binary");
    await writeFile(join(root, "obj", "cache.json"), "cache");
    await writeFile(join(root, ".harnix", "journal.jsonl"), "journal");
    await writeFile(join(root, "App.csproj"), "<Project />");

    const task = taskFixture({
      validationPlan: [
        {
          id: "check-all",
          description: "All files",
          scope: "full",
          required: true,
          command: "pnpm test",
          criterionIds: ["ac-one"],
          inputs: ["**"],
        },
      ],
    });

    const snapshot = await computeInputDigest(root, task, "check-all");
    const paths = snapshot.entries.map((entry) => entry.path);
    expect(paths).toContain("src/a.ts");
    expect(paths).toContain("src/b.ts");
    expect(paths.some((p) => p.includes("bin/") || p.includes("obj/") || p.includes(".harnix/"))).toBe(false);
  });

  describe("signal-based transient directories", () => {
    async function put(root: string, path: string, content = "x"): Promise<void> {
      const destination = join(root, ...path.split("/"));
      await mkdir(dirname(destination), { recursive: true });
      await writeFile(destination, content);
    }

    async function digestPaths(root: string, inputs: string[]): Promise<string[]> {
      const task = taskFixture({
        validationPlan: [
          {
            id: "check-all",
            description: "All files",
            scope: "full",
            required: true,
            command: "pnpm test",
            criterionIds: ["ac-one"],
            inputs,
          },
        ],
      });
      return (await computeInputDigest(root, task, "check-all")).entries.map((entry) => entry.path);
    }

    it("skips bin and obj only beside a .NET project file", async () => {
      const root = await fixtureRepository();
      await put(root, "Api/Api.csproj");
      await put(root, "Api/bin/Debug/Api.dll");
      await put(root, "Api/obj/project.assets.json");
      await put(root, "tools/bin/cli.js");
      const paths = await digestPaths(root, ["**"]);
      expect(paths).toContain("Api/Api.csproj");
      expect(paths).toContain("tools/bin/cli.js");
      expect(paths.some((path) => path.startsWith("Api/bin/") || path.startsWith("Api/obj/"))).toBe(false);
    });

    it("skips build, dist, coverage and out only beside a package manifest", async () => {
      const root = await fixtureRepository();
      await put(root, "web/package.json", "{}");
      await put(root, "web/dist/main.js");
      await put(root, "web/coverage/lcov.info");
      await put(root, "build/Build.cs");
      const paths = await digestPaths(root, ["**"]);
      expect(paths).toContain("build/Build.cs");
      expect(paths.some((path) => path.startsWith("web/dist/") || path.startsWith("web/coverage/"))).toBe(false);
    });

    it("always skips dependency, test-result and IDE directories regardless of letter case", async () => {
      const root = await fixtureRepository();
      await put(root, "node_modules/pkg/index.js");
      await put(root, "Api/TestResults/run.trx");
      await put(root, "Api/testresults/run.trx");
      await put(root, ".VS/state.bin");
      await put(root, ".idea/workspace.xml");
      const paths = await digestPaths(root, ["**"]);
      expect(paths).toEqual(["src/a.ts", "src/b.ts"]);
    });

    it("skips marker-guarded directories regardless of letter case", async () => {
      const root = await fixtureRepository();
      await put(root, "Api/Api.CSPROJ");
      await put(root, "Api/Bin/Api.dll");
      await put(root, "Api/Obj/cache.json");
      const paths = await digestPaths(root, ["**"]);
      expect(paths.some((path) => /^Api\/(Bin|Obj)\//u.test(path))).toBe(false);
    });

    it("does not treat a longer directory name containing bin as targeting bin", async () => {
      const root = await fixtureRepository();
      await put(root, "Api/Api.csproj");
      await put(root, "Api/bin/Api.dll");
      await put(root, "src/Binary/data.ts");
      const paths = await digestPaths(root, ["src/Binary/**", "Api/**"]);
      expect(paths).toContain("src/Binary/data.ts");
      expect(paths.some((path) => path.startsWith("Api/bin/"))).toBe(false);
    });

    it("hashes a guarded directory when an input names that segment", async () => {
      const root = await fixtureRepository();
      await put(root, "Api/Api.csproj");
      await put(root, "Api/bin/Api.dll");
      expect(await digestPaths(root, ["Api/bin/**"])).toEqual(["Api/bin/Api.dll"]);
      expect(await digestPaths(root, ["**/bin/**"])).toEqual(["Api/bin/Api.dll"]);
    });

    it("hashes a declared task artifact under .harnix", async () => {
      const root = await fixtureRepository();
      await put(root, ".harnix/tasks/20260929-090000-digest/plan.md", "# plan");
      const paths = await digestPaths(root, [".harnix/tasks/20260929-090000-digest/plan.md"]);
      expect(paths).toEqual([".harnix/tasks/20260929-090000-digest/plan.md"]);
    });

    it("gives the same digest across consecutive runs even after files land in ignored directories", async () => {
      const root = await fixtureRepository();
      await put(root, "Api/Api.csproj");
      const before = await digestPaths(root, ["**"]);
      await put(root, "Api/bin/new.dll");
      await put(root, "Api/obj/new.json");
      expect(await digestPaths(root, ["**"])).toEqual(before);
    });

    it("hashes many files concurrently to the same digest as the sorted sequential definition", async () => {
      const root = await fixtureRepository();
      for (let index = 0; index < 60; index += 1)
        await put(root, `many/f${String(index).padStart(2, "0")}.txt`, `${index}`);
      const task = taskFixture({
        validationPlan: [
          {
            id: "check-many",
            description: "Many files",
            scope: "full",
            required: true,
            command: "pnpm test",
            criterionIds: ["ac-one"],
            inputs: ["many/**"],
          },
        ],
      });
      const snapshot = await computeInputDigest(root, task, "check-many");
      expect(snapshot.entries.map((entry) => entry.path)).toEqual(
        Array.from({ length: 60 }, (_, index) => `many/f${String(index).padStart(2, "0")}.txt`),
      );
      const expected = createHash("sha256").update("7").digest("hex");
      expect(snapshot.entries.find((entry) => entry.path === "many/f07.txt")?.sha256).toBe(expected);
      expect((await computeInputDigest(root, task, "check-many")).inputDigest).toBe(snapshot.inputDigest);
    });
  });
});
