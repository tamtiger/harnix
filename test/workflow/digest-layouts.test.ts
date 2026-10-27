import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildCheck, buildTaskV3 } from "test/support/builders.js";
import { computeInputDigest } from "src/core/verification/input-digest.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-digest-layout-");
const ID = "20260929-090000-digest";

const LAYOUTS: [string, string[]][] = [
  ["flat", ["tasks", ID]],
  ["month bucket", ["tasks", "2026-09", ID]],
  ["archive", ["tasks", "_archive", "2026-09", ID]],
];

describe("input digest exemption of the task's own files", () => {
  it.each(LAYOUTS)("leaves out task.json and review.md of a task stored in the %s layout", async (_name, segments) => {
    const root = await temporaryRepository();
    const directory = join(root, ".harnix", ...segments);
    await mkdir(directory, { recursive: true });
    for (const file of ["task.json", "review.md", "plan.md"]) await writeFile(join(directory, file), `${file}\n`);
    const task = buildTaskV3({
      id: ID,
      validationPlan: [buildCheck({ id: "chk", inputs: [".harnix/tasks/**"] })],
    });

    const paths = (await computeInputDigest(root, task, "chk")).entries.map((entry) => entry.path);

    expect(paths).toEqual([[".harnix", ...segments, "plan.md"].join("/")]);
  });
});
