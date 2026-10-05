export class JsonTextError extends Error {
  override name = "JsonTextError";
}

export interface ValueNode {
  kind: "object" | "array" | "scalar";
  start: number;
  end: number;
  members: MemberNode[];
  items: ValueNode[];
}

/** `start` is the first character of the quoted key and `end` the end of its value. */
export interface MemberNode {
  key: string;
  start: number;
  end: number;
  value: ValueNode;
}

const WHITESPACE = new Set([" ", "\t", "\r", "\n"]);
const DELIMITERS = new Set([",", "]", "}", ...WHITESPACE]);
const SCALAR = /^(?:-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null)$/u;

/**
 * Strict JSON parser that records the offset of every value instead of decoding numbers. It exists so a shared
 * settings file can be edited in place: the bytes outside the edited span are never re-serialized.
 */
export function parseJsonText(text: string): ValueNode {
  let index = text.startsWith(String.fromCharCode(0xfeff)) ? 1 : 0;
  const fail = (message: string): never => {
    throw new JsonTextError(`Invalid JSON at offset ${index}: ${message}.`);
  };
  const skip = (): void => {
    while (index < text.length && WHITESPACE.has(text[index]!)) index += 1;
  };
  const expect = (character: string): void => {
    if (text[index] !== character) fail(`expected '${character}'`);
    index += 1;
  };
  const scalar = (start: number): ValueNode => ({ kind: "scalar", start, end: index, members: [], items: [] });

  function readString(): string {
    const start = index;
    expect('"');
    while (index < text.length && text[index] !== '"') {
      if (text.charCodeAt(index) < 0x20) fail("control character in string");
      index += text[index] === "\\" ? 2 : 1;
    }
    expect('"');
    try {
      return JSON.parse(text.slice(start, index)) as string;
    } catch {
      return fail("bad string");
    }
  }

  function readLiteral(): ValueNode {
    const start = index;
    while (index < text.length && !DELIMITERS.has(text[index]!)) index += 1;
    if (!SCALAR.test(text.slice(start, index))) fail("unexpected token");
    return scalar(start);
  }

  function readMember(): MemberNode {
    const start = index;
    const key = readString();
    skip();
    expect(":");
    const value = readValue();
    return { key, start, end: value.end, value };
  }

  function readContainer(kind: "object" | "array"): ValueNode {
    const node: ValueNode = { kind, start: index, end: index, members: [], items: [] };
    const close = kind === "object" ? "}" : "]";
    index += 1;
    skip();
    if (text[index] === close) {
      index += 1;
    } else {
      for (;;) {
        skip();
        if (kind === "object") node.members.push(readMember());
        else node.items.push(readValue());
        skip();
        if (text[index] === ",") index += 1;
        else if (text[index] === close) break;
        else fail(`expected ',' or '${close}'`);
      }
      index += 1;
    }
    node.end = index;
    return node;
  }

  function readValue(): ValueNode {
    skip();
    const character = text[index];
    if (character === "{") return readContainer("object");
    if (character === "[") return readContainer("array");
    if (character === '"') {
      const start = index;
      readString();
      return scalar(start);
    }
    return readLiteral();
  }

  const root = readValue();
  skip();
  if (index !== text.length) fail("unexpected trailing content");
  return root;
}
