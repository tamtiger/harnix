import { describe, expect, it } from "vitest";

import { detectEol, findHookConflict, withEol } from "src/core/global/toml-guard.js";

const HARNIX_BLOCK = [
  "# harnix:codex-hook:begin",
  "[[hooks.UserPromptSubmit]]",
  "[[hooks.UserPromptSubmit.hooks]]",
  'command = "harnix context --platform codex"',
  "# harnix:codex-hook:end",
].join("\n");

describe("findHookConflict", () => {
  it.each([
    ["a key of the [hooks] table", "[hooks]\nUserPromptSubmit = []\n"],
    ["a quoted key of the [hooks] table", '[hooks]\n"UserPromptSubmit" = []\n'],
    ["a dotted root key", "hooks.UserPromptSubmit = []\n"],
    ["a dotted root key with spaces", "hooks . UserPromptSubmit = [] # note\n"],
    ["a single table", "[hooks.UserPromptSubmit]\ncommand = 'x'\n"],
    ["a nested single table", "[hooks.UserPromptSubmit.extra]\nvalue = 1\n"],
    ["an inline hooks table", "hooks = { UserPromptSubmit = [] }\n"],
    ["a CRLF file", "[hooks]\r\nUserPromptSubmit = []\r\n"],
  ])("reports %s", (_name, toml) => {
    expect(findHookConflict(toml)).toMatch(/hooks\.UserPromptSubmit/u);
  });

  it("names the line of the conflicting definition", () => {
    expect(findHookConflict("[features]\nhooks = true\n\n[hooks]\nUserPromptSubmit = []\n")).toMatch(/line 5/u);
  });

  it.each([
    ["an empty file", ""],
    ["unrelated settings", '[features]\nhooks = true\n\nmodel = "x"\n'],
    ["the hook trust state", '[hooks.state]\n"abc" = { trusted = true }\n'],
    ["the same key in another table", "[other]\nUserPromptSubmit = []\n[other.hooks]\nUserPromptSubmit = 1\n"],
    ["a dotted key under another table", "[other]\nhooks.UserPromptSubmit = []\n"],
    ["array-of-tables hook entries", "[[hooks.UserPromptSubmit]]\n[[hooks.UserPromptSubmit.hooks]]\ncommand = 'x'\n"],
    ["a previous Harnix block", `${HARNIX_BLOCK}\n`],
    ["a comment mentioning the key", "# hooks.UserPromptSubmit = []\n"],
    ["a string value mentioning the key", 'note = "UserPromptSubmit = []"\n'],
  ])("accepts %s", (_name, toml) => {
    expect(findHookConflict(toml)).toBeUndefined();
  });
});

describe("detectEol and withEol", () => {
  it("detects CRLF only when it dominates the file", () => {
    expect(detectEol("a\r\nb\r\n")).toBe("\r\n");
    expect(detectEol("a\nb\n")).toBe("\n");
    expect(detectEol("a\r\nb\nc\nd\n")).toBe("\n");
    expect(detectEol("")).toBe("\n");
  });

  it("converts LF text to the requested ending without doubling an existing CR", () => {
    expect(withEol("a\nb\n", "\r\n")).toBe("a\r\nb\r\n");
    expect(withEol("a\r\nb\n", "\r\n")).toBe("a\r\nb\r\n");
    expect(withEol("a\nb\n", "\n")).toBe("a\nb\n");
  });
});
