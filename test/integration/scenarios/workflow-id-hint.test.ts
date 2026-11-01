import { describe, expect, it } from "vitest";

import { assertCommandShape } from "src/commands/workflow-flags.js";

describe("id flag hint", () => {
  it("names only the id slot for the remove flags", () => {
    const attempt = () => assertCommandShape("removeRisk", { removeRisk: "--brief", brief: true }, []);
    expect(attempt).toThrow(/--remove-risk <id>\.\n/u);
    expect(attempt).not.toThrow(/<id> --brief/u);
  });

  it("keeps the other flags in the id slot hint", () => {
    expect(() => assertCommandShape("setBaseline", { setBaseline: "--result" }, [])).toThrow(
      /--set-baseline <id> --result <r>/u,
    );
  });
});
