import { describe, expect, it } from "vitest";

import { commandHints, splitHint } from "src/cli-hints.js";
import { createProgram } from "src/cli-program.js";

describe("cli hints", () => {
  it("splits a Gợi ý line or a Commander suggestion off the message", () => {
    expect(splitHint("Bad.\nGợi ý: làm X.")).toEqual({ message: "Bad.", hint: "làm X." });
    expect(splitHint("error: unknown option '--x'\n(Did you mean --y?)")).toEqual({
      message: "error: unknown option '--x'",
      hint: "Did you mean --y?",
    });
    expect(splitHint("Plain.")).toEqual({ message: "Plain." });
  });

  it("names the command that owns an option used on the wrong command", () => {
    const message = commandHints(
      createProgram(),
      ["node", "harnix", "status", "--yes"],
      "error: unknown option '--yes'",
    );

    expect(message).toMatch(/--yes không thuộc harnix status; nó dùng với harnix /u);
  });

  it("reminds that the --run-check command goes after --", () => {
    const argv = ["node", "harnix", "workflow", "--run-check", "c", "pnpm", "-C", "x"];

    expect(commandHints(createProgram(), argv, "error: unknown option '-C'")).toContain("-- <exe>");
  });

  it("does not take an option for the command name", () => {
    const message = commandHints(
      createProgram(),
      ["node", "harnix", "--limit", "3"],
      "error: unknown option '--limit'",
    );

    expect(message).not.toContain("harnix --limit;");
  });

  it("drops the suggestion of a sibling option once it knows which command owns the flag", () => {
    const argv = ["node", "harnix", "status", "--yes"];
    const message = commandHints(
      createProgram(),
      argv,
      "error: unknown option '--yes'" + "\n" + "(Did you mean --summary?)",
    );

    expect(message).toMatch(/--yes không thuộc harnix status/u);
    expect(message).not.toContain("Did you mean");
  });

  it("leaves a message without a known hint unchanged", () => {
    expect(commandHints(createProgram(), ["node", "harnix", "status"], "Other.")).toBe("Other.");
  });
});
