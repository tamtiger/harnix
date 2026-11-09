import { describe, expect, it } from "vitest";
import { appendEvidenceFlagsWorkflow } from "src/core/workflow/evidence-flags.js";
import { setCheckWorkflow } from "src/core/workflow/plan-edit.js";
import { replaceCheckWorkflow } from "src/core/workflow/replace-check.js";
import { transitionWorkflow } from "src/core/workflow/transition.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { implementingTaskV3 } from "test/support/workflow-fixtures.js";

const temporaryRepository = useTemporaryRepositories();
const REASON = "Sửa cấu hình check khi đang verifying, không đổi hợp đồng kiểm thử.";

async function verifyingWithFailedCheck(root: string) {
  await implementingTaskV3(root);
  await appendEvidenceFlagsWorkflow(
    root,
    { check: "check", result: "fail", exitCode: "1", summary: "wrong working directory" },
    "2026-08-13T00:10:00.000Z",
  );
  await transitionWorkflow(root, "verifying", "verifying", "2026-08-13T00:20:00.000Z");
}

describe("workflow check edits while verifying stay in verifying", () => {
  it("replace-check retires a failed check and ends at verifying/verifying", async () => {
    const root = await temporaryRepository();
    await verifyingWithFailedCheck(root);

    const replaced = await replaceCheckWorkflow(
      root,
      { oldId: "check", newId: "check-b", command: "pnpm eslint src/focused", scope: "focused", inputs: ["src/**"] },
      { reason: REASON },
      "2026-08-13T00:30:00.000Z",
    );

    expect([replaced.status, replaced.checkpoint]).toEqual(["verifying", "verifying"]);
    expect(replaced.validationPlan.find((c) => c.id === "check-b")?.required).toBe(true);
    expect(replaced.validationPlan.find((c) => c.id === "check")?.required).toBe(false);
  });

  it("set-check on a check without evidence ends at verifying/verifying", async () => {
    const root = await temporaryRepository();
    await verifyingWithFailedCheck(root);
    await setCheckWorkflow(
      root,
      { id: "extra", description: "d", scope: "focused", criteria: ["a"], inputs: ["src/**"] },
      { reason: REASON },
      "2026-08-13T00:30:00.000Z",
    );

    const edited = await setCheckWorkflow(
      root,
      { id: "extra", description: "changed", scope: "focused", criteria: ["a"], inputs: ["src/**"] },
      { reason: REASON },
      "2026-08-13T00:40:00.000Z",
    );

    expect([edited.status, edited.checkpoint]).toEqual(["verifying", "verifying"]);
    expect(edited.validationPlan.find((c) => c.id === "extra")?.description).toBe("changed");
  });
});
