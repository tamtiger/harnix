import type { DesiredGlobalManagedFile } from "src/utils/global-managed-files.js";
import { renderHarnixRules } from "./activation.js";
import { renderSkill, workflowSkills } from "./workflow.js";

/**
 * Canonical standalone rules document. Every platform whose global surface owns a whole rule/steering file
 * renders exactly these bytes, so the rules cannot drift between platforms.
 */
export const HARNIX_GLOBAL_ACTIVATION_DOCUMENT = ["# Harnix", "", "## Harnix rules", "", renderHarnixRules(), ""].join(
  "\n",
);

/**
 * Root-relative canonical skill files for one platform. Paths stay identical
 * across platforms; only `sourceId` differs so each platform manifest keeps
 * separate ownership of the same canonical bytes.
 */
export function globalSkillDesiredFiles(sourceIdPrefix: string): DesiredGlobalManagedFile[] {
  return workflowSkills.map((skill): DesiredGlobalManagedFile => ({
    path: `skills/${skill.name}/SKILL.md`,
    sourceId: `${sourceIdPrefix}-${skill.name}`,
    kind: "file",
    content: renderSkill(skill),
  }));
}
