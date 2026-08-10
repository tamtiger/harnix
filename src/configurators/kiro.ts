import type { DesiredManagedFile } from "../utils/managed-files.js";
import { renderSkill, workflowSkills } from "../templates/harnix/workflow.js";
import { packageVersion } from "../version.js";

export function kiroDesiredFiles(languages: string[]): DesiredManagedFile[] {
  const files = workflowSkills.map((skill) => managed(`.kiro/skills/${skill.name}/SKILL.md`, skill.name, renderSkill(skill)));
  files.push(managed(".kiro/steering/harnix.md", "kiro-steering", `# Harnix\n\nUse the project-local Harnix workflow and relevant .harnix context.\n\nDetected languages: ${languages.join(", ") || "none"}.\n`));
  files.push(managed(".kiro/hooks/harnix-context.kiro.hook", "kiro-context-hook", `${JSON.stringify({ version: "1.0.0", enabled: true, when: { type: "promptSubmit" }, then: { type: "runCommand", command: "harnix internal context --platform kiro" } }, null, 2)}\n`));
  return files;
}

function managed(path: string, sourceId: string, content: string): DesiredManagedFile {
  return { entry: { path, sourceId, scope: "kiro", generatedHash: "0".repeat(64), generatorVersion: packageVersion }, content };
}
