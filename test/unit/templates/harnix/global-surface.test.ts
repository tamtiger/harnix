import { describe, expect, it } from "vitest";

import { HARNIX_RULES, renderHarnixRules } from "src/templates/harnix/activation.js";
import { HARNIX_GLOBAL_ACTIVATION_DOCUMENT, globalSkillDesiredFiles } from "src/templates/harnix/global-surface.js";
import { renderSkill, workflowSkills } from "src/templates/harnix/workflow.js";

/** Skill files are whole-file entries, so only they carry `content`. */
const contentOf = (file: { kind: string; content?: string }): string | undefined =>
  file.kind === "file" ? file.content : undefined;

describe("global surface templates", () => {
  describe("HARNIX_GLOBAL_ACTIVATION_DOCUMENT", () => {
    it("is a standalone document headed by the rules section and ends with a newline", () => {
      expect(HARNIX_GLOBAL_ACTIVATION_DOCUMENT.startsWith("# Harnix\n\n## Harnix rules\n\n")).toBe(true);
      expect(HARNIX_GLOBAL_ACTIVATION_DOCUMENT.endsWith("\n")).toBe(true);
    });

    it("carries every rule verbatim and in order", () => {
      expect(HARNIX_GLOBAL_ACTIVATION_DOCUMENT).toContain(renderHarnixRules());
      const positions = HARNIX_RULES.map((rule) => HARNIX_GLOBAL_ACTIVATION_DOCUMENT.indexOf(rule));
      expect(positions.every((position) => position > -1)).toBe(true);
      expect([...positions].sort((left, right) => left - right)).toEqual(positions);
    });
  });

  describe("globalSkillDesiredFiles", () => {
    it("emits canonical SKILL.md and reference files for workflow skills with the rendered bytes", () => {
      const files = globalSkillDesiredFiles("kiro");
      const totalExpected = workflowSkills.reduce((sum, skill) => sum + 1 + Object.keys(skill.references).length, 0);

      expect(files).toHaveLength(totalExpected);
      for (const skill of workflowSkills) {
        expect(files).toContainEqual({
          path: `skills/${skill.name}/SKILL.md`,
          sourceId: `kiro-${skill.name}`,
          kind: "file",
          content: renderSkill(skill),
        });
        for (const [topic, text] of Object.entries(skill.references)) {
          expect(files).toContainEqual({
            path: `skills/${skill.name}/references/${topic}.md`,
            sourceId: `kiro-${skill.name}-ref-${topic}`,
            kind: "file",
            content: text,
          });
        }
      }
    });

    it("keeps paths and bytes identical across platforms while sourceIds stay platform-specific", () => {
      const codex = globalSkillDesiredFiles("codex");
      const claude = globalSkillDesiredFiles("claude");

      expect(codex.map((file) => file.path)).toEqual(claude.map((file) => file.path));
      expect(codex.map(contentOf)).toEqual(claude.map(contentOf));
      expect(codex.every((file, index) => file.sourceId !== claude[index]!.sourceId)).toBe(true);
      expect(new Set(codex.map((file) => file.sourceId)).size).toBe(codex.length);
    });
  });
});
