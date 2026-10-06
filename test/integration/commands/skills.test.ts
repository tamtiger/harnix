import { describe, expect, it } from "vitest";

import { reportSkill, reportSkillCatalog, reportSkillReference } from "src/commands/skills.js";
import type { WorkflowStageOwner } from "src/core/workflow/routing.js";
import { renderSkill, workflowSkills } from "src/templates/harnix/workflow.js";
import { packageVersion } from "src/version.js";

describe("harnix skill", () => {
  it("should_list_every_canonical_skill_without_body_content", () => {
    const result = reportSkillCatalog();

    expect(result.generator).toBe("harnix");
    expect(result.schemaVersion).toBe(1);
    expect(result.skills.map((skill) => skill.name)).toEqual(workflowSkills.map((skill) => skill.name));
    expect(result.skills.every((skill) => skill.version === packageVersion)).toBe(true);
    expect(result.skills.every((skill) => skill.description.startsWith("Use when "))).toBe(true);
    expect(JSON.stringify(result)).not.toContain("## Harnix rules");
  });

  it("should_list_the_on_demand_references_of_each_skill", () => {
    const skills = new Map(reportSkillCatalog().skills.map((skill) => [skill.name, skill.references]));

    expect(skills.get("harnix-plan")).toEqual(["replan", "migration", "epic", "multi-repo", "ready-review"]);
    expect(skills.get("harnix-implement")).toEqual(["feedback"]);
    expect(skills.get("harnix-verify")).toEqual(["evidence", "finish-cancel"]);
    expect(skills.get("harnix-review")).toEqual([]);
  });

  it("should_return_byte_identical_canonical_content_for_one_skill", () => {
    for (const skill of workflowSkills) {
      const result = reportSkill(skill.name);

      expect(result).toEqual({
        generator: "harnix",
        schemaVersion: 1,
        name: skill.name,
        description: skill.description,
        version: packageVersion,
        content: renderSkill(skill),
        references: Object.keys(skill.references),
      });
    }
  });

  it("should_fail_closed_for_an_unknown_or_unsafe_skill_name", () => {
    for (const name of ["", "harnix-unknown", "../../etc/passwd", "HARNIX-IMPLEMENT", "harnix-implement/SKILL.md"]) {
      expect(() => reportSkill(name)).toThrow(/Unknown Harnix skill/u);
    }
  });

  it("should_resolve_an_earlier_skill_name_to_its_replacement", () => {
    expect(reportSkill("harnix-brainstorm")).toMatchObject({ name: "harnix-plan", resolvedFrom: "harnix-brainstorm" });
    expect(reportSkill("harnix-check")).toMatchObject({ name: "harnix-verify", resolvedFrom: "harnix-check" });
    expect(reportSkill("harnix-finish-work")).toMatchObject({
      name: "harnix-verify",
      resolvedFrom: "harnix-finish-work",
    });
    expect(reportSkill("harnix-continue")).toMatchObject({
      name: "harnix-plan",
      resolvedFrom: "harnix-continue",
      note: expect.stringContaining("workflow --preflight"),
    });
    expect("resolvedFrom" in reportSkill("harnix-research")).toBe(false);
  });

  it("should_return_one_reference_and_list_the_valid_topics_for_an_unknown_one", () => {
    const skill = workflowSkills.find(({ name }) => name === "harnix-plan")!;

    expect(reportSkillReference("harnix-plan", "replan")).toEqual({
      generator: "harnix",
      schemaVersion: 1,
      name: "harnix-plan",
      reference: "replan",
      content: skill.references.replan,
    });
    expect(reportSkillReference("harnix-check", "evidence")).toMatchObject({ name: "harnix-verify" });
    expect(() => reportSkillReference("harnix-plan", "nope")).toThrow(
      /Available: replan, migration, epic, multi-repo, ready-review/u,
    );
    expect(() => reportSkillReference("harnix-review", "anything")).toThrow(/has no references/u);
    expect(() => reportSkillReference("harnix-plan", "__proto__")).toThrow(/Unknown reference/u);
    expect(() => reportSkillReference("harnix-unknown", "replan")).toThrow(/Unknown Harnix skill/u);
  });

  it("should_name_every_skill_the_router_can_select", () => {
    const names = new Set(reportSkillCatalog().skills.map((skill) => skill.name));
    const owners: WorkflowStageOwner[] = [
      "harnix-plan",
      "harnix-implement",
      "harnix-verify",
      "harnix-review",
      "harnix-research",
      "harnix-debug",
    ];

    expect([...names].sort()).toEqual([...owners].sort());
  });

  it("should_report_technique_skills_and_include_them_when_all_is_requested", () => {
    const defaultCatalog = reportSkillCatalog();
    expect(defaultCatalog.skills.some((s) => s.name === "harnix-verification-gap")).toBe(false);

    const allCatalog = reportSkillCatalog({ all: true });
    expect(allCatalog.skills.some((s) => s.name === "harnix-verification-gap")).toBe(true);

    const verificationGap = reportSkill("harnix-verification-gap");
    expect(verificationGap.name).toBe("harnix-verification-gap");
    expect(verificationGap.content).toContain("# Verification gap analysis");
  });

  it("should_include_and_report_project_skills_when_provided", () => {
    const customSkill = {
      name: "domain-compliance",
      description: "Use when verifying domain compliance requirements.",
      version: "1.0.0",
      content: "# Domain compliance skill\n",
      body: "Instructions for domain compliance.",
      references: { faq: "# FAQ content\n" },
    };

    const catalog = reportSkillCatalog({ all: true, projectSkills: [customSkill] });
    const found = catalog.skills.find((s) => s.name === "domain-compliance");
    expect(found).toBeDefined();
    expect(found!.kind).toBe("project");
    expect(found!.references).toEqual(["faq"]);

    const reported = reportSkill("domain-compliance", [customSkill]);
    expect(reported.name).toBe("domain-compliance");
    expect(reported.content).toBe(customSkill.content);
    expect(reported.references).toEqual(["faq"]);

    const refReport = reportSkillReference("domain-compliance", "faq", [customSkill]);
    expect(refReport.reference).toBe("faq");
    expect(refReport.content).toBe("# FAQ content\n");
  });
});
