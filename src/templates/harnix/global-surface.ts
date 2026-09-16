import type { DesiredGlobalManagedFile } from "../../utils/global-managed-files.js";
import { HARNIX_IMPLICIT_ACTIVATION_INSTRUCTIONS, HARNIX_TARGET_AUTHORITY_INSTRUCTIONS } from "./activation.js";
import { renderSkill, workflowSkills } from "./workflow.js";

/**
 * Canonical standalone activation-guard document. Every platform whose global
 * surface owns a whole rule/steering file renders exactly these bytes, so the
 * guard cannot drift between platforms.
 */
export const HARNIX_GLOBAL_ACTIVATION_DOCUMENT = [
  "# Harnix",
  "",
  "## Harnix activation guard",
  "",
  ...HARNIX_TARGET_AUTHORITY_INSTRUCTIONS,
  ...HARNIX_IMPLICIT_ACTIVATION_INSTRUCTIONS,
  "",
].join("\n");

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
