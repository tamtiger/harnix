import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { atomicWriteFile } from "../utils/atomic-write.js";
import type { LanguageId } from "../utils/detection.js";

export const commonRules = `# Harnix common engineering rules

- Keep changes scoped, reviewable, and covered by fresh verification.
- Preserve user data and do not expose secrets or machine-specific paths.
- Validate boundaries, handle errors explicitly, and prefer deterministic behavior.
`;
export const attribution = { source: "Harnix-authored adaptations informed by ECC/Superpowers research", license: "MIT-compatible adaptation metadata; see NOTICE" } as const;
const packs: Record<LanguageId, string> = {
  "csharp-dotnet-abp": `# C#/.NET/ABP rules\n\n- Enable nullable reference types and honor cancellation tokens.\n- Keep authorization, validation, application services, and persistence boundaries explicit.\n- Use async APIs, DI, EF Core query boundaries, and focused xUnit tests.\n`,
  "typescript-nestjs": `# TypeScript/NestJS rules\n\n- Keep strict types and validate external input at controller boundaries.\n- Separate modules, application services, persistence, and transport concerns.\n- Test behavior with deterministic fixtures and avoid hidden global state.\n`,
  python: `# Python rules\n\n- Use type hints, explicit resource management, and small testable modules.\n- Validate external data and keep I/O at clear boundaries.\n`,
  "java-spring": `# Java/Spring rules\n\n- Keep transaction and persistence boundaries explicit.\n- Apply Bean Validation and Spring Security at the boundary; test with JUnit/Testcontainers where integration behavior matters.\n`,
  go: `# Go rules\n\n- Return and wrap errors with context; keep interfaces small.\n- Pass context.Context through cancellation-sensitive operations and test table-driven behavior.\n`,
  "react-web": `# React web rules\n\n- Preserve accessibility, keyboard navigation, and semantic HTML.\n- Treat client data as untrusted; test user behavior with Testing Library.\n`,
  vue: `# Vue rules\n\n- Keep components focused, props/events typed, and state ownership explicit.\n- Validate user input and test rendered behavior.\n`,
};

export interface SeedRulesOptions { root: string; languages: LanguageId[]; force?: boolean; }
export interface SeedRulesResult { paths: string[]; preserved: string[]; }
export function composeRules(languages: LanguageId[]): string { return [commonRules, ...[...new Set(languages)].sort((a, b) => a.localeCompare(b)).map((language) => packs[language])].join("\n"); }

export async function seedRules(options: SeedRulesOptions): Promise<SeedRulesResult> {
  const selected = [...new Set(options.languages)].sort((a, b) => a.localeCompare(b));
  const files = [{ path: ".harnix/spec/guides/common-rules.md", content: commonRules }, ...selected.map((language) => ({ path: `.harnix/spec/guides/${language}.md`, content: packs[language] }))];
  const paths: string[] = [], preserved: string[] = [];
  for (const file of files) {
    const absolute = join(options.root, ...file.path.split("/"));
    if (!options.force && await exists(absolute)) { preserved.push(file.path); continue; }
    await mkdir(join(absolute, ".."), { recursive: true }); await atomicWriteFile(absolute, file.content); paths.push(file.path);
  }
  return { paths, preserved };
}
async function exists(path: string): Promise<boolean> { try { await readFile(path); return true; } catch { return false; } }
