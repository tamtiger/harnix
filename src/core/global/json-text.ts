import { parseCanonicalJsonPointer } from "src/core/global/managed-json.js";
import type { JsonValue } from "src/core/global/managed-files.js";
import { JsonTextError, parseJsonText, type ValueNode } from "src/core/global/json-text-parse.js";
import { detectEol } from "src/core/global/toml-guard.js";

export { JsonTextError } from "src/core/global/json-text-parse.js";

interface Style {
  eol: "\r\n" | "\n";
  unit: string;
}

type Render = (indent: string, compact: boolean) => string;

const splice = (text: string, start: number, end: number, insertion: string): string =>
  `${text.slice(0, start)}${insertion}${text.slice(end)}`;

function lineIndent(text: string, offset: number): string {
  const lineStart = text.lastIndexOf("\n", offset - 1) + 1;
  return /^[ \t]*/u.exec(text.slice(lineStart))?.[0] ?? "";
}

function styleOf(text: string): Style {
  const unit = /^([ \t]+)\S/mu.exec(text)?.[1];
  return { eol: detectEol(text), unit: unit ?? "  " };
}

function pretty(value: JsonValue, style: Style, indent: string): string {
  const [first = "", ...rest] = JSON.stringify(value, null, style.unit).split("\n");
  return [first, ...rest.map((line) => `${indent}${line}`)].join(style.eol);
}

function childOf(node: ValueNode, token: string): ValueNode | undefined {
  if (node.kind === "object") return node.members.find((member) => member.key === token)?.value;
  if (node.kind === "array" && /^(?:0|[1-9]\d*)$/u.test(token)) return node.items[Number(token)];
  return undefined;
}

function deepest(root: ValueNode, tokens: readonly string[]): { node: ValueNode; depth: number } {
  let node = root;
  for (const [depth, token] of tokens.entries()) {
    const next = childOf(node, token);
    if (next === undefined) return { node, depth };
    node = next;
  }
  return { node, depth: tokens.length };
}

function resolve(root: ValueNode, tokens: readonly string[]): ValueNode | undefined {
  const { node, depth } = deepest(root, tokens);
  return depth === tokens.length ? node : undefined;
}

function nest(tokens: readonly string[], member: JsonValue): JsonValue {
  const [token, ...rest] = tokens;
  return token === undefined ? [member] : { [token]: nest(rest, member) };
}

function spansOf(node: ValueNode): { start: number; end: number }[] {
  return node.kind === "object" ? node.members : node.items;
}

function insertInto(text: string, node: ValueNode, style: Style, render: Render): string {
  const spans = spansOf(node);
  const first = spans[0];
  const last = spans.at(-1);
  if (first !== undefined && last !== undefined) {
    if (!text.slice(node.start, first.start).includes("\n")) {
      return splice(text, last.end, last.end, `, ${render("", true)}`);
    }
    const indent = lineIndent(text, first.start);
    return splice(text, last.end, last.end, `,${style.eol}${indent}${render(indent, false)}`);
  }
  const closeIndent = lineIndent(text, node.start);
  const itemIndent = `${closeIndent}${style.unit}`;
  const inner = `${style.eol}${itemIndent}${render(itemIndent, false)}${style.eol}${closeIndent}`;
  return splice(text, node.start + 1, node.end - 1, inner);
}

function arrayAt(root: ValueNode, tokens: readonly string[]): ValueNode {
  const node = resolve(root, tokens);
  if (node === undefined || node.kind !== "array") {
    throw new JsonTextError("The JSON pointer does not resolve to an array.");
  }
  return node;
}

/** Appends `member` to the array at `pointer`, creating missing objects on the way, and touches no other byte. */
export function insertArrayMember(text: string, pointer: string, member: JsonValue): string {
  const tokens = parseCanonicalJsonPointer(pointer);
  const root = parseJsonText(text);
  const style = styleOf(text);
  const { node, depth } = deepest(root, tokens);
  if (depth === tokens.length) {
    if (node.kind !== "array") throw new JsonTextError("The JSON pointer does not resolve to an array.");
    return insertInto(text, node, style, (indent, compact) =>
      compact ? JSON.stringify(member) : pretty(member, style, indent),
    );
  }
  if (node.kind !== "object") throw new JsonTextError("The JSON pointer crosses a value that is not an object.");
  const key = JSON.stringify(tokens[depth]!);
  const value = nest(tokens.slice(depth + 1), member);
  return insertInto(text, node, style, (indent, compact) =>
    compact ? `${key}: ${JSON.stringify(value)}` : `${key}: ${pretty(value, style, indent)}`,
  );
}

/** Replaces one element of the array at `pointer`, leaving its neighbours and the surrounding layout alone. */
export function replaceArrayMember(text: string, pointer: string, index: number, member: JsonValue): string {
  const array = arrayAt(parseJsonText(text), parseCanonicalJsonPointer(pointer));
  const item = array.items[index];
  if (item === undefined) throw new JsonTextError("The JSON array has no element at that index.");
  return splice(text, item.start, item.end, pretty(member, styleOf(text), lineIndent(text, item.start)));
}

function removeSpan(text: string, container: ValueNode, index: number): string {
  const spans = spansOf(container);
  const target = spans[index];
  if (target === undefined) throw new JsonTextError("The JSON container has no element at that index.");
  if (spans.length === 1) return splice(text, container.start + 1, container.end - 1, "");
  const previous = spans[index - 1];
  if (previous !== undefined) return splice(text, previous.end, target.end, "");
  return splice(text, target.start, spans[index + 1]!.start, "");
}

/**
 * Removes one element of the array at `pointer`. Containers the removal leaves empty (the array, then each parent
 * object) are removed too, so a path Harnix created disappears with its last member.
 */
export function removeArrayMember(text: string, pointer: string, index: number): string {
  const tokens = parseCanonicalJsonPointer(pointer);
  let current = removeSpan(text, arrayAt(parseJsonText(text), tokens), index);
  const path = [...tokens];
  while (path.length > 0) {
    const root = parseJsonText(current);
    const node = resolve(root, path);
    if (node === undefined || spansOf(node).length > 0) break;
    const parent = resolve(root, path.slice(0, -1));
    const key = path.at(-1)!;
    const position = parent?.kind === "object" ? parent.members.findIndex((member) => member.key === key) : Number(key);
    if (parent === undefined || position < 0) break;
    current = removeSpan(current, parent, position);
    path.pop();
  }
  return current;
}

/** True for a document that is only an empty object or array, which a file Harnix emptied should not keep. */
export function isEmptyJsonRoot(text: string): boolean {
  try {
    const root = parseJsonText(text);
    return root.kind !== "scalar" && spansOf(root).length === 0;
  } catch {
    return false;
  }
}
