import { workflowSkills, workflowTemplate } from "src/templates/harnix/workflow.js";

/** The lean `.harnix/workflow.md` plus the on-demand detail pages of `harnix-verify` it points to. */
const detailSkill = workflowSkills.find((skill) => skill.name === "harnix-verify");

export const workflowGuidance: string = [workflowTemplate, ...Object.values(detailSkill?.references ?? {})].join("\n");
