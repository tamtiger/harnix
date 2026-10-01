import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { guideSources } from "src/guides/catalog.js";

const MAX_TOKENS = 600;
const MAX_CONSTRAINTS = 10;
const MAX_MISTAKES = 6;
const SECTIONS = ["## Verify", "## Constraints", "## Common mistakes"];

const tokens = (text: string): number => Math.ceil(text.length / 4);
const lines = (text: string): string[] => text.split(/\r?\n/u);

function content(id: string): string {
  const found = guideSources.find(({ descriptor }) => descriptor.id === id);
  if (found === undefined) throw new Error(`guide ${id} is missing`);
  return found.content;
}

/** The lines under one `## heading`, up to the next `## heading`. */
function section(text: string, heading: string): string[] {
  const all = lines(text);
  const start = all.indexOf(heading);
  if (start === -1) return [];
  const end = all.findIndex((line, index) => index > start && line.startsWith("## "));
  return all.slice(start + 1, end === -1 ? undefined : end);
}

const bullets = (rows: string[]): string[] => rows.filter((row) => row.startsWith("- "));

describe("packaged guide format", () => {
  it.each(guideSources.map(({ descriptor }) => descriptor.id))(
    "%s has a title and the three sections in order",
    (id) => {
      const headings = lines(content(id)).filter((line) => /^#{1,3} /u.test(line));

      expect(headings[0]).toMatch(/^# \S/u);
      expect(headings.slice(1)).toEqual(SECTIONS);
    },
  );

  it.each(guideSources.map(({ descriptor }) => descriptor.id))("%s stays within the token budget", (id) => {
    expect(tokens(content(id))).toBeLessThanOrEqual(MAX_TOKENS);
  });

  it.each(guideSources.map(({ descriptor }) => descriptor.id))("%s lists verify commands and bounded rules", (id) => {
    const text = content(id);
    const verify = section(text, "## Verify").join("\n");
    const fenced = /```text\r?\n([\s\S]*?)```/u.exec(verify)?.[1] ?? "";

    expect(fenced.split(/\r?\n/u).filter((row) => row.trim() !== "").length).toBeGreaterThan(0);
    expect(bullets(section(text, "## Constraints")).length).toBeGreaterThan(0);
    expect(bullets(section(text, "## Constraints")).length).toBeLessThanOrEqual(MAX_CONSTRAINTS);
    expect(bullets(section(text, "## Common mistakes")).length).toBeGreaterThan(0);
    expect(bullets(section(text, "## Common mistakes")).length).toBeLessThanOrEqual(MAX_MISTAKES);
  });
});

describe("stale guide content", () => {
  it("teaches Next.js proxy and INP instead of middleware.ts and FID", () => {
    const text = content("technology-nextjs");

    expect(text).toContain("proxy.ts");
    expect(text).toContain("INP");
    expect(text).not.toMatch(/\bFID\b/u);
    for (const line of lines(text).filter((row) => row.includes("middleware.ts"))) expect(line).toContain("proxy.ts");
  });

  it("does not recommend the unmaintained bleach sanitizer in the Django guide", () => {
    const text = content("technology-django");

    expect(text).toContain("nh3");
    for (const line of lines(text).filter((row) => row.includes("bleach")))
      expect(line).toMatch(/unmaintained|no longer maintained|do not use/iu);
  });

  it("points Go at staticcheck and the internal/cmd layout instead of gosimple and pkg/", () => {
    const text = content("language-go");

    expect(text).toContain("staticcheck");
    expect(text).toContain("internal/");
    for (const line of lines(text).filter((row) => row.includes("gosimple"))) expect(line).toContain("staticcheck");
    for (const line of lines(text).filter((row) => row.includes("pkg/"))) expect(line).toMatch(/avoid|do not/iu);
  });
});

describe("project facts documentation", () => {
  it.each(["docs/HARNIX_PRD.md", "docs/IMPLEMENTATION_PLAN.md"])("%s describes project-facts.md", (path) => {
    expect(readFileSync(path, "utf8")).toContain("project-facts.md");
  });
});
