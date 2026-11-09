import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { canonicalSkills } from "src/skills/catalog.js";

const root = process.cwd();
const TABLE_FILE = "docs/RULE_OWNERSHIP.md";
const MIN_RULE_GROUPS = [
  "Cổng ready và finish",
  "Thời điểm review",
  "Chính sách version",
  "Trạng thái task",
  "Secret",
  "Trần token",
];

interface Row {
  rule: string;
  canonical: string;
  cells: string;
}

function rows(): Row[] {
  return readFileSync(join(root, TABLE_FILE), "utf8")
    .split("\n")
    .filter((line) => line.startsWith("| ") && !line.startsWith("| ---") && !line.startsWith("| Nhóm quy tắc"))
    .map((line) => {
      const [rule = "", canonical = "", ...rest] = line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim());
      return { rule, canonical, cells: [canonical, ...rest].join(" | ") };
    });
}

const ticks = (text: string): string[] => [...text.matchAll(/`([^`]+)`/gu)].map((match) => match[1] ?? "");

describe("docs/RULE_OWNERSHIP.md", () => {
  it("names every rule group with an owner and a detail location", () => {
    const names = rows().map((row) => row.rule);

    for (const group of MIN_RULE_GROUPS) expect(names, group).toContain(group);
    for (const row of rows()) expect(ticks(row.cells).length, row.rule).toBeGreaterThanOrEqual(2);
  });

  it("points only at files that exist", () => {
    for (const row of rows())
      for (const token of ticks(row.cells))
        if (/^[\w./-]+\.(?:md|ts|mjs|json)$/u.test(token))
          expect(existsSync(join(root, token)), `${row.rule}: ${token}`).toBe(true);
  });

  it("points only at skill references that exist", () => {
    const known = new Set(
      canonicalSkills.flatMap((skill) => Object.keys(skill.references).map((topic) => `${skill.name}/${topic}`)),
    );

    for (const row of rows())
      for (const token of ticks(row.cells)) {
        const match = /^harnix skill (harnix-[\w-]+) --reference ([\w-]+)$/u.exec(token);
        if (match) expect(known.has(`${match[1]}/${match[2]}`), `${row.rule}: ${token}`).toBe(true);
      }
  });

  // The canonical column must name the owner, and that owner must carry the rule's own wording.
  const OWNER_PHRASES: [string, string, string, string][] = [
    ["Cổng ready và finish", "src/templates/harnix/workflow.md", "src/templates/harnix/workflow.md", "**Ready:**"],
    ["Thời điểm review", "AGENTS.md", "AGENTS.md", "Thời điểm `harnix-review`:"],
    ["Chính sách version", "AGENTS.md", "AGENTS.md", "pnpm version:sync"],
    ["Trạng thái task", "src/templates/harnix/workflow.md", "src/templates/harnix/workflow.md", "## Task state"],
    [
      "Bằng chứng và độ tươi",
      "harnix skill harnix-verify --reference evidence",
      "src/skills/harnix-verify/references/evidence.md",
      "inputDigest",
    ],
    [
      "Epic và gom member",
      "harnix skill harnix-plan --reference epic",
      "src/skills/harnix-plan/references/epic.md",
      "## Grouping members",
    ],
    ["Secret", "src/core/workflow/secret-scan.ts", "src/core/workflow/secret-scan.ts", "harnix-secret-waiver"],
    [
      "Commit và branch",
      "src/templates/harnix/activation.ts",
      "src/templates/harnix/activation.ts",
      "git branch --show-current",
    ],
    [
      "Trần token",
      "src/templates/harnix/token-budgets.json",
      "src/templates/harnix/token-budgets.json",
      "referenceExemptions",
    ],
  ];

  it.each(OWNER_PHRASES)(
    "%s: the canonical owner %s carries the wording of the rule",
    (group, anchor, file, phrase) => {
      const row = rows().find((candidate) => candidate.rule === group);

      expect(row?.canonical ?? "", `${group}: canonical column`).toContain(anchor);
      expect(readFileSync(join(root, file), "utf8"), `${file} lost "${phrase}"`).toContain(phrase);
    },
  );
});
