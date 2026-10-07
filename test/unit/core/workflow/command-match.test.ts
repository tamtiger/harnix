import { describe, expect, it } from "vitest";

import { describeCommand, normalizeCommand, sameCommand, splitCommand } from "src/core/workflow/command-match.js";

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

describe("sameCommand with an executable path", () => {
  it("matches a bare declared executable against an absolute path, a Windows path with spaces and a suffix", () => {
    for (const executable of ["/usr/bin/node", "C:\\Program Files\\nodejs\\node.exe", "C:\\nodejs\\NODE.EXE", "node"])
      expect(sameCommand("node -e process.exit(0)", [executable, "-e", "process.exit(0)"])).toBe(true);
    expect(sameCommand("pnpm test", ["C:\\Program Files\\pnpm\\pnpm.cmd", "run", "test"])).toBe(true);
  });

  it("still rejects another executable name and any different argument", () => {
    expect(sameCommand("node -e 0", ["/usr/bin/nodejs", "-e", "0"])).toBe(false);
    expect(sameCommand("node -e 0", ["/usr/bin/node", "-e", "1"])).toBe(false);
    expect(sameCommand("node -e 0", ["/usr/bin/node", "-e", "0", "x"])).toBe(false);
  });

  it("compares arguments one by one, so a word split differently does not match", () => {
    expect(sameCommand("pwsh -Command 'a b'", ["pwsh", "-Command", "a b"])).toBe(true);
    expect(sameCommand("pwsh -Command 'a b'", ["pwsh", "-Command", "a", "b"])).toBe(false);
  });

  it("requires the exact path when the declared executable has a directory", () => {
    expect(sameCommand("/opt/tools/node -e 0", ["/opt/tools/node", "-e", "0"])).toBe(true);
    expect(sameCommand("/opt/tools/node -e 0", ["C:\\other\\node.exe", "-e", "0"])).toBe(false);
    expect(sameCommand("C:\\tools\\node.exe -e 0", ["c:/tools/node", "-e", "0"])).toBe(true);
  });
});

describe("describeCommand", () => {
  it("returns the normalized command and truncates a long one", () => {
    expect(describeCommand(["pnpm", "run", "test"])).toBe("pnpm test");
    expect(describeCommand(["C:\\Users\\dev\\tools\\node.exe", "-e", "0"])).toBe("node -e 0");
    const long = describeCommand(["node", "x".repeat(500)]);
    expect(long.length).toBeLessThanOrEqual(200);
    expect(long.endsWith("...")).toBe(true);
  });
});

describe("splitCommand", () => {
  it.each([
    ["pnpm run test", ["pnpm", "run", "test"]],
    ["  node   -e  0 ", ["node", "-e", "0"]],
    [
      'pwsh.exe -NoProfile -Command "pnpm lint && pnpm test"',
      ["pwsh.exe", "-NoProfile", "-Command", "pnpm lint && pnpm test"],
    ],
    ["node -e 'process.exit(0)'", ["node", "-e", "process.exit(0)"]],
  ])("splits %j into %j", (input, expected) => {
    expect(splitCommand(input)).toEqual(expected);
  });

  it("produces an argv that sameCommand accepts for the declared command", () => {
    const declared = 'pwsh.exe -NoProfile -Command "pnpm lint && pnpm test"';

    expect(sameCommand(declared, splitCommand(declared))).toBe(true);
  });
});
