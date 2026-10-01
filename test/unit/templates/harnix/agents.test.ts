import { describe, expect, it } from "vitest";

import { renderAgentsTemplate } from "src/templates/harnix/agents.js";

const profile = { languages: ["typescript" as const], technologies: [], packages: [{ path: "." }], version: "9.9.9" };

describe("agents bootstrap template", () => {
  it("points the agent at the derived project facts file and says it is not to be edited", () => {
    const text = renderAgentsTemplate(profile);

    expect(text).toContain("`.harnix/spec/project-facts.md`");
    expect(text).toMatch(/derived/iu);
    expect(text).toContain("`.harnix/spec/guides/`");
  });

  it("stamps the version and lists the discovered profile before the rules", () => {
    const text = renderAgentsTemplate(profile);

    expect(text).toContain("Harnix version: 9.9.9.");
    expect(text).toContain("- Languages: TypeScript.");
    expect(text.indexOf("## Project profile")).toBeLessThan(text.indexOf("## Harnix"));
  });
});
