export interface InitCheckSpec {
  id: string;
  command: string;
  criterionIds: string[];
  inputs: string[];
  scope: "focused" | "full";
  description?: string;
}

const KEYS = ["id", "command", "criteria", "input", "scope", "description"] as const;
const REQUIRED = ["id", "command", "criteria", "input"] as const;

const list = (value: string): string[] =>
  [
    ...new Set(
      value
        .split("+")
        .map((item) => item.trim())
        .filter((item) => item !== ""),
    ),
  ].sort();

/**
 * One `--with-check` value: `key=value` pairs separated by semicolons (id, command, criteria, input, scope,
 * description); `criteria` and `input` are plus-separated lists. A value may contain `=` but not `;`.
 */
export function parseCheckSpec(spec: string): InitCheckSpec {
  const text = spec.trim();
  if (text === "")
    throw new Error('--with-check requires "id=<id>;command=<cmd>;criteria=<ac-1+ac-2>;input=<glob+glob>".');
  const values = new Map<string, string>();
  for (const part of text.split(";")) {
    const at = part.indexOf("=");
    if (at <= 0) throw new Error(`--with-check "${spec}": "${part.trim()}" is not key=value.`);
    const key = part.slice(0, at).trim();
    if (!(KEYS as readonly string[]).includes(key))
      throw new Error(`--with-check "${spec}": unknown key ${key} (allowed: ${KEYS.join(", ")}).`);
    if (values.has(key)) throw new Error(`--with-check "${spec}": repeated key ${key}.`);
    values.set(key, part.slice(at + 1).trim());
  }
  for (const key of REQUIRED)
    if ((values.get(key) ?? "") === "") throw new Error(`--with-check "${spec}": missing key ${key}.`);
  const scope = values.get("scope") ?? "focused";
  if (scope !== "focused" && scope !== "full")
    throw new Error(`--with-check "${spec}": scope must be focused or full.`);
  const description = values.get("description");
  return {
    id: values.get("id") as string,
    command: values.get("command") as string,
    criterionIds: list(values.get("criteria") as string),
    inputs: list(values.get("input") as string),
    scope,
    ...(description !== undefined && description !== "" ? { description } : {}),
  };
}
