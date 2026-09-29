import { describe, expect, it } from "vitest";

import {
  HARNIX_IMPLICIT_ACTIVATION_INSTRUCTIONS,
  HARNIX_TARGET_AUTHORITY_INSTRUCTIONS,
} from "src/templates/harnix/activation.js";
import { HARNIX_GLOBAL_ACTIVATION_DOCUMENT, globalSkillDesiredFiles } from "src/templates/harnix/global-surface.js";
import { renderSkill, workflowSkills } from "src/templates/harnix/workflow.js";

/** Skill files are whole-file entries, so only they carry `content`. */
const contentOf = (file: { kind: string; content?: string }): string | undefined =>
  file.kind === "file" ? file.content : undefined;

describe("global surface templates", () => {
  describe("HARNIX_GLOBAL_ACTIVATION_DOCUMENT", () => {
    it("is a standalone document headed by the activation guard section and ends with a newline", () => {
      expect(HARNIX_GLOBAL_ACTIVATION_DOCUMENT.startsWith("# Harnix\n\n## Harnix activation guard\n\n")).toBe(true);
      expect(HARNIX_GLOBAL_ACTIVATION_DOCUMENT.endsWith("\n")).toBe(true);
    });

    it("carries every target-authority and implicit-activation instruction verbatim", () => {
      for (const line of [...HARNIX_TARGET_AUTHORITY_INSTRUCTIONS, ...HARNIX_IMPLICIT_ACTIVATION_INSTRUCTIONS]) {
        expect(HARNIX_GLOBAL_ACTIVATION_DOCUMENT).toContain(line);
      }
    });

    it("places the target-authority instructions before the implicit-activation ones", () => {
      const authority = HARNIX_GLOBAL_ACTIVATION_DOCUMENT.indexOf(HARNIX_TARGET_AUTHORITY_INSTRUCTIONS[0]);
      const implicit = HARNIX_GLOBAL_ACTIVATION_DOCUMENT.indexOf(HARNIX_IMPLICIT_ACTIVATION_INSTRUCTIONS[0]);

      expect(authority).toBeGreaterThan(-1);
      expect(implicit).toBeGreaterThan(authority);
    });
  });

  describe("globalSkillDesiredFiles", () => {
    it("emits one canonical SKILL.md file per workflow skill with the rendered skill bytes", () => {
      const files = globalSkillDesiredFiles("kiro");

      expect(files).toHaveLength(workflowSkills.length);
      for (const [index, skill] of workflowSkills.entries()) {
        expect(files[index]).toEqual({
          path: `skills/${skill.name}/SKILL.md`,
          sourceId: `kiro-${skill.name}`,
          kind: "file",
          content: renderSkill(skill),
        });
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
