import { flagIssueError } from "./flag-issues.js";

export interface InitCheckSpec {
  id: string;
  command: string;
  criterionIds: string[];
  inputs: string[];
  scope: "focused" | "full";
  description?: string;
  cwd?: string;
}

const EXAMPLE =
  "id=<id>;command=<cmd>;criteria=<ac-1+ac-2>;input=<glob+glob>[;scope=focused|full;description=<t>;cwd=<dir>]";
const KEYS = ["id", "command", "criteria", "input", "scope", "description", "cwd"] as const;
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
 * description, cwd); `criteria` and `input` are plus-separated lists. A value may contain `=` but not `;`.
 */
export function parseCheckSpec(spec: string): InitCheckSpec {
  const text = spec.trim();
  if (text === "") throw new Error(`--with-check requires "${EXAMPLE}".`);
  const values = new Map<string, string>();
  const issues: string[] = [];
  for (const part of text.split(";")) {
    const at = part.indexOf("=");
    if (at <= 0) {
      issues.push(`"${part.trim()}" is not key=value.`);
      continue;
    }
    const key = part.slice(0, at).trim();
    if (!(KEYS as readonly string[]).includes(key)) issues.push(`unknown key ${key} (allowed: ${KEYS.join(", ")}).`);
    else if (values.has(key)) issues.push(`repeated key ${key}.`);
    else values.set(key, part.slice(at + 1).trim());
  }
  for (const key of REQUIRED) if ((values.get(key) ?? "") === "") issues.push(`missing key ${key}.`);
  const scope = values.get("scope") ?? "focused";
  if (scope !== "focused" && scope !== "full") issues.push(`scope must be focused or full (got "${scope}").`);
  if (issues.length > 0) {
    const named = issues.length === 1 ? issues.map((issue) => `--with-check "${spec}": ${issue}`) : issues;
    throw flagIssueError("--with-check", named, `--with-check "${EXAMPLE}" (checked: "${spec}")`);
  }
  const description = values.get("description");
  const cwd = values.get("cwd");
  return {
    id: values.get("id") as string,
    command: values.get("command") as string,
    criterionIds: list(values.get("criteria") as string),
    inputs: list(values.get("input") as string),
    scope: scope as "focused" | "full",
    ...(description !== undefined && description !== "" ? { description } : {}),
    ...(cwd !== undefined && cwd !== "" ? { cwd } : {}),
  };
}
