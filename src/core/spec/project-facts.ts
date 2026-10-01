import { readFile } from "node:fs/promises";

import { readConfig } from "src/core/config/config.js";
import type { VerifyCommandConfig } from "src/core/config/config-schema.js";
import { buildVerifyPlan } from "src/core/stack/verify-plan.js";
import { atomicWriteFile } from "src/utils/atomic-write.js";
import { resolveSafeHarnixPath, resolveSafeProjectPath } from "src/utils/paths.js";

/** Derived file: rewritten by `init` and `update`, never listed in the managed manifest, never user-owned. */
export const PROJECT_FACTS_PATH = ".harnix/spec/project-facts.md";

/** Keeps the file small in a large monorepo; the rest stay discoverable through `harnix verify-plan`. */
const MAX_LISTED_PACKAGES = 20;
const COMMAND_ORDER = ["test", "lint", "typecheck", "format", "suite"] as const;

export interface ProjectFactsInput {
  languages: readonly string[];
  technologies: readonly string[];
  packages: readonly { path: string; languages: readonly string[]; technologies: readonly string[] }[];
}

export interface ProjectFactsPlan {
  hasTests: boolean;
  commands: VerifyCommandConfig;
  packages: readonly {
    path: string;
    ecosystem?: string | undefined;
    hasTests: boolean;
    commands: VerifyCommandConfig;
  }[];
  warnings: readonly string[];
}

const list = (values: readonly string[]): string => (values.length === 0 ? "none" : values.join(", "));

function commandSummary(commands: VerifyCommandConfig): string {
  const parts = COMMAND_ORDER.flatMap((name) => {
    const command = commands[name];
    return typeof command === "string" && command.trim() !== "" ? [`${name} \`${command.trim()}\``] : [];
  });
  return parts.length === 0 ? "none detected" : parts.join("; ");
}

function capped<T>(items: readonly T[], render: (item: T) => string): string[] {
  const lines = items.slice(0, MAX_LISTED_PACKAGES).map((item) => `- ${render(item)}`);
  if (items.length > MAX_LISTED_PACKAGES) lines.push(`- and ${items.length - MAX_LISTED_PACKAGES} more packages`);
  return lines;
}

/** Pure and deterministic: the same stack and plan always give the same text, so a rewrite only happens on a real change. */
export function renderProjectFacts(input: ProjectFactsInput, plan: ProjectFactsPlan): string {
  const sections = [
    "# Project facts",
    "Derived by `harnix init` and `harnix update`; do not edit, it is rewritten on every run. The stack below is the confirmed one from `.harnix/config.yaml`; `harnix verify-plan` prints the same commands.",
    [
      "## Stack",
      `- Languages: ${list(input.languages)}`,
      `- Technologies: ${list(input.technologies)}`,
      ...capped(input.packages, (pkg) => `\`${pkg.path}\`: ${list([...pkg.languages, ...pkg.technologies])}`),
    ].join("\n"),
    [
      "## Verify commands",
      `- project: ${commandSummary(plan.commands)}`,
      ...capped(
        plan.packages,
        (pkg) =>
          `\`${pkg.path}\`${pkg.ecosystem === undefined ? "" : ` (${pkg.ecosystem})`}: ${commandSummary(pkg.commands)}`,
      ),
    ].join("\n"),
  ];
  if (plan.warnings.length > 0)
    sections.push(["## Warnings", ...plan.warnings.map((warning) => `- ${warning}`)].join("\n"));
  return `${sections.join("\n\n")}\n`;
}

/** Writes `.harnix/spec/project-facts.md` from the confirmed config and the detected verify plan. */
export async function writeProjectFacts(root: string): Promise<"created" | "updated" | "unchanged"> {
  const config = await readConfig(await resolveSafeHarnixPath(root, "config.yaml"));
  const text = renderProjectFacts(config, await buildVerifyPlan(root));
  const destination = await resolveSafeProjectPath(root, PROJECT_FACTS_PATH);
  let current: string | undefined;
  try {
    current = await readFile(destination, "utf8");
  } catch (error: unknown) {
    if (typeof error !== "object" || error === null || (error as { code?: string }).code !== "ENOENT") throw error;
  }
  if (current === text) return "unchanged";
  await atomicWriteFile(destination, text);
  return current === undefined ? "created" : "updated";
}
