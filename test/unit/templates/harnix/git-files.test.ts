import { describe, expect, it } from "vitest";

import {
  HARNIX_GITATTRIBUTES_PATH,
  HARNIX_GITIGNORE_PATH,
  gitattributesTemplate,
  gitignoreTemplate,
} from "src/templates/harnix/git-files.js";

describe("git file templates", () => {
  it("live inside .harnix so the repository's own .gitignore and .gitattributes stay untouched", () => {
    expect(HARNIX_GITIGNORE_PATH).toBe(".harnix/.gitignore");
    expect(HARNIX_GITATTRIBUTES_PATH).toBe(".harnix/.gitattributes");
  });

  it("explain who owns the file and how to keep the journal out of git", () => {
    expect(gitignoreTemplate.split("\n")[0]).toContain("Managed by Harnix");
    expect(gitattributesTemplate.split("\n")[0]).toContain("Managed by Harnix");
  });

  it("use LF only, one trailing newline and no absolute path", () => {
    for (const template of [gitignoreTemplate, gitattributesTemplate]) {
      expect(template).not.toContain("\r");
      expect(template.endsWith("\n")).toBe(true);
      expect(template.endsWith("\n\n")).toBe(false);
      expect(template).not.toMatch(/[A-Za-z]:[\\/]/u);
    }
  });
});
