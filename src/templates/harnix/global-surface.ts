import type { DesiredGlobalManagedFile } from "src/core/global/managed-files.js";
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
  const files: DesiredGlobalManagedFile[] = [];
  for (const skill of workflowSkills) {
    files.push({
      path: `skills/${skill.name}/SKILL.md`,
      sourceId: `${sourceIdPrefix}-${skill.name}`,
      kind: "file",
      content: renderSkill(skill),
    });
    for (const [topic, content] of Object.entries(skill.references)) {
      files.push({
        path: `skills/${skill.name}/references/${topic}.md`,
        sourceId: `${sourceIdPrefix}-${skill.name}-ref-${topic}`,
        kind: "file",
        content,
      });
    }
  }
  return files;
}
