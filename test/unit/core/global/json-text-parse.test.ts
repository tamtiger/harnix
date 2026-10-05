import { describe, expect, it } from "vitest";

import { JsonTextError, parseJsonText } from "src/core/global/json-text-parse.js";

describe("parseJsonText", () => {
  it("records the offset of every value and keeps numbers as source text positions", () => {
    const text = '{ "a": [1, 12345678901234567890], "b": "x" }';

    const root = parseJsonText(text);

    expect(root.kind).toBe("object");
    expect(text.slice(root.start, root.end)).toBe(text);
    const [a, b] = root.members;
    expect(a?.key).toBe("a");
    expect(text.slice(a!.start, a!.end)).toBe('"a": [1, 12345678901234567890]');
    expect(a?.value.items.map((item) => text.slice(item.start, item.end))).toEqual(["1", "12345678901234567890"]);
    expect(text.slice(b!.value.start, b!.value.end)).toBe('"x"');
  });

  it("skips a byte order mark and whitespace around the root", () => {
    const text = `${String.fromCharCode(0xfeff)}  [] \r\n`;

    const root = parseJsonText(text);

    expect(root.kind).toBe("array");
    expect(text.slice(root.start, root.end)).toBe("[]");
  });

  it("decodes escaped keys and keeps escaped quotes inside strings", () => {
    const root = parseJsonText('{"a\\"b": "c\\"d", "\\u0041": true, "n": null, "f": -1.5e+3}');

    expect(root.members.map((member) => member.key)).toEqual(['a"b', "A", "n", "f"]);
  });

  it.each([
    "",
    "   ",
    "{",
    "[1,]",
    '{"a":1,}',
    '{"a" 1}',
    "{a:1}",
    "[1 2]",
    '{"a":01x}',
    "tru",
    '"unterminated',
    '"tab\tinside"',
    "[] []",
    "{} trailing",
    "undefined",
  ])("rejects %j", (text) => {
    expect(() => parseJsonText(text)).toThrow(JsonTextError);
  });
});
