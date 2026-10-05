import { describe, expect, it } from "vitest";

import {
  JsonTextError,
  insertArrayMember,
  isEmptyJsonRoot,
  removeArrayMember,
  replaceArrayMember,
} from "src/core/global/json-text.js";

const POINTER = "/hooks/UserPromptSubmit";
const MEMBER = { command: "x", id: "h" };
const BOM = String.fromCharCode(0xfeff);

describe("insertArrayMember", () => {
  it("creates the missing path in an empty object using two-space indentation", () => {
    expect(insertArrayMember("{}\n", POINTER, MEMBER)).toBe(
      [
        "{",
        '  "hooks": {',
        '    "UserPromptSubmit": [',
        "      {",
        '        "command": "x",',
        '        "id": "h"',
        "      }",
        "    ]",
        "  }",
        "}",
        "",
      ].join("\n"),
    );
  });

  it("keeps every other byte, the indent unit and a number a JSON round trip would corrupt", () => {
    const original = '{\n    "model": "x",\n    "big": 12345678901234567890\n}\n';

    const result = insertArrayMember(original, POINTER, MEMBER);

    expect(
      result.startsWith('{\n    "model": "x",\n    "big": 12345678901234567890,\n    "hooks": {\n        "User'),
    ).toBe(true);
    expect(result.endsWith("}\n")).toBe(true);
    expect(JSON.parse(result.replace("12345678901234567890", "1")).hooks.UserPromptSubmit).toEqual([MEMBER]);
  });

  it("appends to an existing array after the last element and keeps the user's groups", () => {
    const original = `{\n  "hooks": {\n    "UserPromptSubmit": [\n      { "id": "mine" }\n    ]\n  }\n}\n`;

    const result = insertArrayMember(original, POINTER, MEMBER);

    expect(result.startsWith(`{\n  "hooks": {\n    "UserPromptSubmit": [\n      { "id": "mine" },\n      {\n`)).toBe(
      true,
    );
    expect(JSON.parse(result).hooks.UserPromptSubmit).toEqual([{ id: "mine" }, MEMBER]);
  });

  it("fills an empty array, adds a sibling key next to existing hooks and handles a single-line document", () => {
    const empty = insertArrayMember('{"hooks":{"UserPromptSubmit":[]}}', POINTER, MEMBER);
    expect(JSON.parse(empty).hooks.UserPromptSubmit).toEqual([MEMBER]);

    const sibling = insertArrayMember('{\n  "hooks": {\n    "PreToolUse": []\n  }\n}\n', POINTER, MEMBER);
    expect(sibling.startsWith('{\n  "hooks": {\n    "PreToolUse": [],\n    "UserPromptSubmit": [\n')).toBe(true);
    expect(JSON.parse(sibling).hooks).toEqual({ PreToolUse: [], UserPromptSubmit: [MEMBER] });

    const inline = insertArrayMember('{"a":[1,2]}', "/a", 3);
    expect(JSON.parse(inline).a).toEqual([1, 2, 3]);
  });

  it("supports a root array pointer", () => {
    expect(JSON.parse(insertArrayMember("[]\n", "", MEMBER))).toEqual([MEMBER]);
    expect(JSON.parse(insertArrayMember('[\n  { "id": "mine" }\n]\n', "", MEMBER))).toEqual([{ id: "mine" }, MEMBER]);
  });

  it("rejects a path that crosses a scalar or an array, and text that is not JSON", () => {
    expect(() => insertArrayMember('{"hooks": 1}', POINTER, MEMBER)).toThrow(JsonTextError);
    expect(() => insertArrayMember('{"hooks": []}', POINTER, MEMBER)).toThrow(JsonTextError);
    expect(() => insertArrayMember('{"hooks": {"UserPromptSubmit": {}}}', POINTER, MEMBER)).toThrow(JsonTextError);
    expect(() => insertArrayMember("{not json", POINTER, MEMBER)).toThrow(JsonTextError);
    expect(() => insertArrayMember('{"a": 1} trailing', POINTER, MEMBER)).toThrow(JsonTextError);
    expect(() => insertArrayMember("", POINTER, MEMBER)).toThrow(JsonTextError);
  });
});

describe("remove after insert returns the original bytes", () => {
  const originals: [string, string][] = [
    ["two-space with other keys", '{\n  "model": "x",\n  "env": { "Z": 1, "A": 2 }\n}\n'],
    ["four-space with a large number", '{\n    "big": 12345678901234567890,\n    "z": 1\n}\n'],
    ["tab indented", '{\n\t"model": "x"\n}\n'],
    ["CRLF", '{\r\n  "model": "x"\r\n}\r\n'],
    ["with a byte order mark", `${BOM}{\n  "model": "x"\n}\n`],
    ["hooks with another event", '{\n  "hooks": {\n    "PreToolUse": [ { "id": "p" } ]\n  },\n  "a": 1\n}\n'],
    [
      "hooks that already hold a user group",
      '{\n  "hooks": {\n    "UserPromptSubmit": [\n      { "id": "mine" }\n    ]\n  }\n}\n',
    ],
    ["no trailing newline", '{"model":"x"}'],
    ["keys out of alphabetical order", '{\n  "z": 1,\n  "a": 2\n}\n'],
  ];

  it.each(originals)("%s", (_name, original) => {
    const inserted = insertArrayMember(original, POINTER, MEMBER);
    expect(inserted).not.toBe(original);
    const members = JSON.parse(inserted.replace(BOM, "").replace(/12345678901234567890/u, "1")).hooks.UserPromptSubmit;
    const index = members.length - 1;

    expect(removeArrayMember(inserted, POINTER, index)).toBe(original);
  });
});

describe("removeArrayMember", () => {
  it("prunes the array, the empty parents and leaves an empty root when Harnix created everything", () => {
    const inserted = insertArrayMember("{}\n", POINTER, MEMBER);

    const result = removeArrayMember(inserted, POINTER, 0);

    expect(result).toBe("{}\n");
    expect(isEmptyJsonRoot(result)).toBe(true);
  });

  it("keeps a sibling event and the user's other groups when only Harnix's member goes", () => {
    const original =
      '{\n  "hooks": {\n    "PreToolUse": [],\n    "UserPromptSubmit": [ { "id": "mine" }, { "id": "h" } ]\n  }\n}\n';

    const result = removeArrayMember(original, POINTER, 1);

    expect(JSON.parse(result)).toEqual({ hooks: { PreToolUse: [], UserPromptSubmit: [{ id: "mine" }] } });
    expect(result).toBe(
      '{\n  "hooks": {\n    "PreToolUse": [],\n    "UserPromptSubmit": [ { "id": "mine" } ]\n  }\n}\n',
    );
  });

  it("removes the first of several elements together with its separator", () => {
    expect(removeArrayMember('{"a":[1,2,3]}', "/a", 0)).toBe('{"a":[2,3]}');
    expect(removeArrayMember('{"a":[1,2,3]}', "/a", 2)).toBe('{"a":[1,2]}');
  });

  it("does not report a root with content as empty", () => {
    expect(isEmptyJsonRoot('{"a":1}')).toBe(false);
    expect(isEmptyJsonRoot("[1]")).toBe(false);
    expect(isEmptyJsonRoot("{\n}\n")).toBe(true);
    expect(isEmptyJsonRoot("3")).toBe(false);
  });

  it("rejects an index that does not exist and a pointer that is not an array", () => {
    expect(() => removeArrayMember('{"a":[1]}', "/a", 4)).toThrow(JsonTextError);
    expect(() => removeArrayMember('{"a":1}', "/a", 0)).toThrow(JsonTextError);
  });
});

describe("replaceArrayMember", () => {
  it("rewrites only the chosen element", () => {
    const original =
      '{\n  "hooks": {\n    "UserPromptSubmit": [\n      { "id": "mine" },\n      { "id": "h" }\n    ]\n  }\n}\n';

    const result = replaceArrayMember(original, POINTER, 1, { id: "h", command: "y" });

    expect(result.startsWith('{\n  "hooks": {\n    "UserPromptSubmit": [\n      { "id": "mine" },\n      {\n')).toBe(
      true,
    );
    expect(JSON.parse(result).hooks.UserPromptSubmit).toEqual([{ id: "mine" }, { id: "h", command: "y" }]);
    expect(result.endsWith("\n    ]\n  }\n}\n")).toBe(true);
  });
});
