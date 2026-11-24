import { describe, expect, it } from "vitest";
import { PATH_LINK_MESSAGE, ROOT_LINK_MESSAGE } from "src/core/platform/user-path-hints.js";

describe("symbolic-link rejection messages", () => {
  it("point at doctor and the relocation variables without naming a machine path", () => {
    for (const message of [PATH_LINK_MESSAGE, ROOT_LINK_MESSAGE]) {
      expect(message).toContain("symbolic link");
      expect(message).toContain("harnix doctor --global");
      for (const variable of ["CLAUDE_CONFIG_DIR", "CODEX_HOME", "XDG_CONFIG_HOME"])
        expect(message).toContain(variable);
      expect(message).not.toMatch(/[A-Za-z]:\|\/home\/|\/Users\//u);
    }
  });
});
