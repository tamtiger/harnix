import { describe, expect, it } from "vitest";

import { describeCommand, normalizeCommand, sameCommand } from "src/core/workflow/command-match.js";

describe("normalizeCommand", () => {
  it.each([
    ["pnpm test", "pnpm test"],
    ["pnpm run test", "pnpm test"],
    ["  npm   run   test  ", "npm test"],
    ["yarn run test", "yarn test"],
    ["PNPM.CMD test", "pnpm test"],
    ['pwsh.exe -NoProfile -Command "pnpm lint && pnpm test"', "pwsh -NoProfile -Command pnpm lint && pnpm test"],
    ["node -e 'process.exit(0)'", "node -e process.exit(0)"],
  ])("normalizes %j to %j", (input, expected) => {
    expect(normalizeCommand(input)).toBe(expected);
  });

  it("keeps a run subcommand of a tool that is not a package manager", () => {
    expect(normalizeCommand("cargo run test")).toBe("cargo run test");
  });
});

describe("sameCommand", () => {
  it("matches the argv of a run against the declared command after normalization", () => {
    expect(sameCommand("pnpm run test", ["pnpm", "test"])).toBe(true);
    expect(sameCommand("pnpm vitest run test/a.test.ts", ["pnpm", "vitest", "run", "test/a.test.ts"])).toBe(true);
    expect(sameCommand('pwsh -Command "a && b"', ["pwsh", "-Command", "a && b"])).toBe(true);
  });

  it("rejects a different executable, different arguments and extra or missing arguments", () => {
    expect(sameCommand("pnpm run test", ["node", "-e", "0"])).toBe(false);
    expect(sameCommand("pnpm run test", ["pnpm", "run", "lint"])).toBe(false);
    expect(sameCommand("pnpm test", ["pnpm", "test", "--filter", "a"])).toBe(false);
    expect(sameCommand("pnpm vitest run a b", ["pnpm", "vitest", "run", "a"])).toBe(false);
  });
});

describe("describeCommand", () => {
  it("returns the normalized command and truncates a long one", () => {
    expect(describeCommand(["pnpm", "run", "test"])).toBe("pnpm test");
    const long = describeCommand(["node", "x".repeat(500)]);
    expect(long.length).toBeLessThanOrEqual(200);
    expect(long.endsWith("...")).toBe(true);
  });
});
