import { describe, expect, it } from "vitest";

import { PRETOOL_EVENT_NAME, isPreToolUseEvent, pretoolHintFor } from "src/commands/pretool-hint.js";

function grep(pattern: unknown, extra: Record<string, unknown> = {}): unknown {
  return { hook_event_name: "PreToolUse", tool_name: "Grep", tool_input: { pattern, ...extra } };
}

function bash(command: unknown): unknown {
  return { hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command } };
}

function parsed(output: string | undefined): {
  hookSpecificOutput: { hookEventName: string; additionalContext: string };
} {
  expect(output).toBeDefined();
  return JSON.parse(output!) as never;
}

describe("isPreToolUseEvent", () => {
  it("recognizes only a record named PreToolUse", () => {
    expect(isPreToolUseEvent({ hook_event_name: PRETOOL_EVENT_NAME })).toBe(true);
    expect(isPreToolUseEvent({ hook_event_name: "UserPromptSubmit" })).toBe(false);
    expect(isPreToolUseEvent(undefined)).toBe(false);
    expect(isPreToolUseEvent("PreToolUse")).toBe(false);
    expect(isPreToolUseEvent([])).toBe(false);
  });
});

describe("pretoolHintFor: reminds on a symbol search", () => {
  it.each([
    ["holds_stock", "holds_stock"],
    ["\\bholds_stock\\b", "holds_stock"],
    ["HoldsStock", "HoldsStock"],
    ["_private1", "_private1"],
  ])("Grep pattern %s names %s", (pattern, symbol) => {
    const out = parsed(pretoolHintFor(grep(pattern)));
    expect(out.hookSpecificOutput.hookEventName).toBe("PreToolUse");
    expect(out.hookSpecificOutput.additionalContext).toContain(`harnix repo-map --refs ${symbol}`);
  });

  it.each([
    ["grep -rn holds_stock src", "holds_stock"],
    ["grep -R holds_stock .", "holds_stock"],
    ["grep -rn 'holds_stock' src/", "holds_stock"],
    ['rg "HoldsStock" src', "HoldsStock"],
    ["rg -n holds_stock", "holds_stock"],
    ["cd src && grep -r holds_stock .", "holds_stock"],
  ])("Bash %s names %s", (command, symbol) => {
    const out = parsed(pretoolHintFor(bash(command)));
    expect(out.hookSpecificOutput.additionalContext).toContain(`--refs ${symbol}`);
  });

  it("never blocks or decides permission", () => {
    const out = parsed(pretoolHintFor(grep("holds_stock"))) as unknown as {
      hookSpecificOutput: Record<string, unknown>;
    };
    expect(Object.keys(out.hookSpecificOutput).sort()).toEqual(["additionalContext", "hookEventName"]);
    expect(Object.keys(out)).toEqual(["hookSpecificOutput"]);
  });

  it("keeps the reminder short and static", () => {
    const text = parsed(pretoolHintFor(grep("holds_stock"))).hookSpecificOutput.additionalContext;
    expect(text.length).toBeLessThan(260);
    expect(text).not.toContain("\n");
  });
});

describe("pretoolHintFor: stays silent", () => {
  it.each([
    "foo.*bar",
    "TODO:",
    "two words",
    "ab",
    "holds-stock",
    "đang tải",
    "holds_stock\\(",
    "a".repeat(81),
    "",
    "123abc",
  ])("Grep pattern %j", (pattern) => {
    expect(pretoolHintFor(grep(pattern))).toBeUndefined();
  });

  it.each([
    "grep holds_stock file.txt",
    "grep -n holds_stock file.txt",
    'grep -r "đang tải" .',
    "grep -r 'two words' .",
    "git grep holds_stock",
    "git log --grep holds_stock",
    "cat holds_stock",
    "ls -R holds_stock",
    "echo grep -r holds_stock",
    "grep -r",
    "rg",
    "grep -rE 'foo|bar' .",
    "grep -r 'holds_stock\\(' .",
    "grep -r $SYMBOL .",
    "grep -r `x` .",
    "rg ab",
    "",
  ])("Bash %j", (command) => {
    expect(pretoolHintFor(bash(command))).toBeUndefined();
  });

  it("ignores other tools and other events", () => {
    expect(
      pretoolHintFor({ hook_event_name: "PreToolUse", tool_name: "Read", tool_input: { pattern: "holds_stock" } }),
    ).toBeUndefined();
    expect(
      pretoolHintFor({ hook_event_name: "PreToolUse", tool_name: "Edit", tool_input: { command: "rg holds_stock" } }),
    ).toBeUndefined();
    expect(
      pretoolHintFor({
        hook_event_name: "UserPromptSubmit",
        tool_name: "Grep",
        tool_input: { pattern: "holds_stock" },
      }),
    ).toBeUndefined();
  });

  it("never throws on malformed shapes", () => {
    for (const value of [undefined, null, 1, "x", [], {}, { hook_event_name: "PreToolUse" }]) {
      expect(pretoolHintFor(value)).toBeUndefined();
    }
    expect(pretoolHintFor({ hook_event_name: "PreToolUse", tool_name: "Grep" })).toBeUndefined();
    expect(pretoolHintFor({ hook_event_name: "PreToolUse", tool_name: "Grep", tool_input: null })).toBeUndefined();
    expect(
      pretoolHintFor({ hook_event_name: "PreToolUse", tool_name: "Grep", tool_input: { pattern: 5 } }),
    ).toBeUndefined();
    expect(
      pretoolHintFor({ hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command: 5 } }),
    ).toBeUndefined();
    expect(pretoolHintFor({ hook_event_name: "PreToolUse", tool_name: 7, tool_input: {} })).toBeUndefined();
  });
});
