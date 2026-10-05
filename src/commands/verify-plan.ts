import { buildVerifyPlan, type VerifyPlan } from "src/core/stack/verify-plan.js";
import { resolveProjectRoot } from "src/utils/paths.js";

export async function inspectVerifyPlan(
  targetPath = process.cwd(),
  options?: { recursive?: boolean },
): Promise<VerifyPlan> {
  const projectRoot = await resolveProjectRoot(targetPath);
  return buildVerifyPlan(projectRoot, options);
}
