import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export interface DocsSyncStatus {
  prdMentionsVerifyPlan: boolean;
  workflowMentionsSuiteGate: boolean;
  implementationPlanMentionsVerify: boolean;
}

export async function checkDocsSync(projectRoot: string): Promise<DocsSyncStatus> {
  const prdText = await readFile(resolve(projectRoot, "docs/HARNIX_PRD.md"), "utf8");
  const workflowText = await readFile(resolve(projectRoot, "docs/HARNIX_WORKFLOW.md"), "utf8");
  const planText = await readFile(resolve(projectRoot, "docs/IMPLEMENTATION_PLAN.md"), "utf8");

  return {
    prdMentionsVerifyPlan: prdText.includes("verify-plan"),
    workflowMentionsSuiteGate: workflowText.includes("Suite Gate") || workflowText.includes("suite gate"),
    implementationPlanMentionsVerify: planText.includes("verify-plan"),
  };
}
