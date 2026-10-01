import workflowSource from "./workflow.md";

export const WORKFLOW_SOURCE_ID = "workflow";

/** `.harnix/workflow.md`: the canonical routing, lifecycle and gate reference; its source is `workflow.md` next to this file. */
export const workflowTemplate = workflowSource.replaceAll("\r\n", "\n").trimEnd() + "\n";

export {
  canonicalSkills,
  legacySkillAliases,
  renderSkill,
  techniqueSkills,
  workflowSkills,
  type SkillTemplate,
} from "src/skills/catalog.js";
