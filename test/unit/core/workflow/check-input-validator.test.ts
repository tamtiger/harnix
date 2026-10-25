import { describe, expect, it } from "vitest";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { validateCheckInputs, assertValidCheckInputs } from "src/core/workflow/check-input-validator.js";
import { setCheckWorkflow } from "src/core/workflow/plan-edit.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { implementingTaskV3 } from "test/support/workflow-fixtures.js";

const temporaryRepository = useTemporaryRepositories();

describe("check-input-validator", () => {
  it("detects non-matching inputs and passes matching inputs", async () => {
    const root = await temporaryRepository();
    await writeFile(join(root, "package.json"), "{}");
    const result = await validateCheckInputs(root, ["non-existent/**/*.ts", "package.json"]);
    expect(result.valid).toBe(false);
    expect(result.emptyInputs).toEqual(["non-existent/**/*.ts"]);
  });

  it("assertValidCheckInputs throws on empty inputs with clear message", () => {
    expect(() => assertValidCheckInputs("chk-test", ["bad/path/**"])).toThrow(
      /Check chk-test declares input pattern\(s\) that match no files in the workspace: "bad\/path\/\*\*"/u,
    );
  });

  it("setCheckWorkflow rejects check declaration when inputs match no files", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);

    await expect(
      setCheckWorkflow(
        root,
        {
          id: "chk-bad",
          description: "A bad check",
          command: "pnpm test",
          criteria: ["a"],
          inputs: ["missing/dir/**/*.ts"],
          scope: "focused",
          required: true,
        },
        { reason: "The user authorized testing this check replacement" },
      ),
    ).rejects.toThrow(/declares input pattern\(s\) that match no files/u);
  });
});
