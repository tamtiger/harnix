import { atomicWriteFile } from "../utils/atomic-write.js";
import { resolveSafeProjectPath } from "../utils/paths.js";

export interface ResearchFinding { taskId: string; topic: string; source: string; researchedAt: string; conclusion: string; remainingUncertainty: string; materialUnknown: boolean; }
export function createResearchFinding(finding: ResearchFinding): string {
  if (!finding.materialUnknown) throw new Error("Research is only recorded for a material unknown.");
  if (![finding.taskId, finding.topic, finding.source, finding.researchedAt, finding.conclusion, finding.remainingUncertainty].every((value) => value.trim().length > 0)) throw new Error("Research finding provenance is required.");
  return `# ${finding.topic}\n\n- Task: ${finding.taskId}\n- Source: ${finding.source}\n- Researched: ${finding.researchedAt}\n\n## Conclusion\n\n${finding.conclusion}\n\n## Remaining uncertainty\n\n${finding.remainingUncertainty}\n`;
}
export async function saveResearchFinding(taskDirectory: string, filename: string, finding: ResearchFinding): Promise<void> {
  if (!/^[a-z0-9][a-z0-9._-]*\.md$/u.test(filename)) throw new Error("Research filename is invalid.");
  await atomicWriteFile(await resolveSafeProjectPath(taskDirectory, `research/${filename}`), createResearchFinding(finding));
}
