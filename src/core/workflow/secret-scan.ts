import { lstat, readFile } from "node:fs/promises";

import { globby } from "globby";

import type { TaskRecord } from "src/core/tasks/task.js";
import { buildGlobIgnores, targetedSegments } from "src/core/verification/transient-directories.js";
import { resolveSafeProjectPath } from "src/utils/paths.js";

const MAX_FILES = 200;
const MAX_FILE_BYTES = 128 * 1024;
const MAX_FINDINGS = 5;

export interface SecretFinding {
  path: string;
  rule: string;
}

export interface SecretAdvisory {
  /** Files with at least one sign of a secret, among the files read. */
  files: number;
  /** At most five, in path order; only a relative path and a rule name, never a value. */
  findings: SecretFinding[];
}

interface Rule {
  name: string;
  pattern: RegExp;
  /** The capture group holding the secret value, when a placeholder value should not count. */
  valueGroup?: number;
}

// Modelled on the credential check of the learning safety module and on the release scan; kept here because the
// release script is outside the runtime package and the learning check has another purpose.
const RULES: readonly Rule[] = [
  { name: "private-key", pattern: /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY-----/gu },
  {
    name: "vendor-token",
    pattern:
      /AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9_]{36,255}|github_pat_[A-Za-z0-9_]{22,}|(?:sk|rk)_live_[0-9a-zA-Z]{24,}|xox[baprs]-[0-9a-zA-Z-]{10,}|AIza[0-9A-Za-z_-]{35}|sk-ant-[A-Za-z0-9_-]{40,}/gu,
  },
  { name: "jwt", pattern: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/gu },
  { name: "connection-string-password", pattern: /\b(?:Password|Pwd)\s*=\s*([^;"'\s]{4,})/giu, valueGroup: 1 },
  {
    name: "connection-string-password",
    pattern: /\b[a-z][a-z0-9+.-]*:\/\/[^\s'"/@:]+:([^\s'"/@]+)@/giu,
    valueGroup: 1,
  },
  {
    name: "credential-assignment",
    pattern: /[\w.-]{0,40}(?:api[_-]?key|password|passwd|pwd|secret|token)["']?\s*[:=]\s*["']([^"'\s]{6,})["']/giu,
    valueGroup: 1,
  },
];

const PLACEHOLDER =
  /^(?:<.*>|\$\{.*\}|\{\{.*\}\}|%.*%|change[-_ ]?me|x{3,}|\*{3,}|your[-_ ].*|example.*|password|secret|token|test|dummy)$/iu;

function matchesRule(text: string, rule: Rule): boolean {
  for (const match of text.matchAll(rule.pattern)) {
    const value = rule.valueGroup === undefined ? undefined : match[rule.valueGroup];
    if (value === undefined || !PLACEHOLDER.test(value)) return true;
  }
  return false;
}

async function candidateFiles(root: string, task: TaskRecord): Promise<string[]> {
  const inputs = task.validationPlan.flatMap((check) => ("inputs" in check ? check.inputs : []));
  const groups = [task.relevantPaths, inputs].map((patterns) =>
    patterns.filter((pattern) => pattern !== "@task-contract" && !pattern.startsWith("!")),
  );
  const ignore = buildGlobIgnores(new Set(groups.flat().flatMap((pattern) => [...targetedSegments(pattern)])));
  const ordered: string[] = [];
  for (const patterns of groups) {
    if (patterns.length === 0) continue;
    const found = await globby(patterns, { cwd: root, onlyFiles: true, followSymbolicLinks: false, dot: true, ignore });
    ordered.push(...found.sort());
  }
  return [...new Set(ordered)].slice(0, MAX_FILES);
}

async function readableText(root: string, path: string): Promise<string | undefined> {
  const absolute = await resolveSafeProjectPath(root, path);
  const info = await lstat(absolute);
  if (!info.isFile() || info.size > MAX_FILE_BYTES) return undefined;
  const content = await readFile(absolute);
  return content.includes(0) ? undefined : content.toString("utf8");
}

/**
 * Looks for signs of a secret in the files a task is about (its relevant paths and the inputs of its checks), so the
 * user hears about a password before it is committed. Bounded, offline, never uses Git and never returns a value;
 * any problem just means no advisory.
 */
export async function scanTaskSecrets(root: string, task: TaskRecord): Promise<SecretAdvisory | undefined> {
  if (task.schemaVersion !== 3) return undefined;
  try {
    const hits: SecretFinding[] = [];
    for (const path of await candidateFiles(root, task)) {
      let text: string | undefined;
      try {
        text = await readableText(root, path);
      } catch {
        continue;
      }
      const rule = text === undefined ? undefined : RULES.find((candidate) => matchesRule(text, candidate));
      if (rule !== undefined) hits.push({ path, rule: rule.name });
    }
    if (hits.length === 0) return undefined;
    hits.sort((left, right) => (left.path < right.path ? -1 : left.path > right.path ? 1 : 0));
    return { files: hits.length, findings: hits.slice(0, MAX_FINDINGS) };
  } catch {
    return undefined;
  }
}
