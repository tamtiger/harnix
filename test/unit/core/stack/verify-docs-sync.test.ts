import { describe, expect, it } from "vitest";

import { checkDocsSync } from "src/core/stack/verify-docs-sync.js";

describe("checkDocsSync (ac-docs-sync)", () => {
  it("verifies PRD, WORKFLOW, and IMPLEMENTATION_PLAN mention verify-plan and suite gate", async () => {
    const status = await checkDocsSync(process.cwd());
    expect(status.prdMentionsVerifyPlan).toBe(true);
    expect(status.workflowMentionsSuiteGate).toBe(true);
    expect(status.implementationPlanMentionsVerify).toBe(true);
  });
});
