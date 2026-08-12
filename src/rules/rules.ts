import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { atomicWriteFile } from "../utils/atomic-write.js";
import type { LanguageId } from "../utils/detection.js";
import { resolveSafeProjectPath } from "../utils/paths.js";

export const commonRules = `# Harnix common engineering rules

- **Repository conventions:** inspect the nearest project instructions, existing architecture, build scripts, and tests before changing code; follow established naming and dependency direction.
- **Scope and ownership:** keep changes limited to the stated acceptance criteria. Preserve unrelated edits, generated/user-owned data, and public compatibility unless the task explicitly changes them.
- **Boundaries:** validate external input at the edge, keep I/O and side effects explicit, propagate cancellation/timeouts, and return actionable errors without leaking secrets or machine paths.
- **Behavior changes:** add a focused failing regression test first when practical, implement the smallest coherent fix, then refactor only while the checks stay green.
- **Acceptance and verification:** run the narrowest meaningful checks first, then the required broader gate. Report actual commands, exit codes, omitted checks, and residual risk; stale output is not evidence.
- **Security and operations:** do not log credentials or sensitive payloads, concatenate untrusted shell input, silently call network services, or perform destructive/external actions without authority.
`;
export const attribution = { source: "Harnix-authored adaptations informed by ECC/Superpowers research", license: "MIT-compatible adaptation metadata; see NOTICE" } as const;
const packs: Record<LanguageId, string> = {
  "csharp-dotnet-abp": `# C#/.NET/ABP rules

- Respect solution-layer dependencies: Domain holds business invariants, Application orchestrates use cases and DTO mapping, and EntityFrameworkCore/Infrastructure owns persistence and external adapters.
- Enforce ABP authorization policies and validation at application boundaries. Preserve tenant context, data filters, audit behavior, and unit-of-work semantics; never trust a client-supplied tenant or permission decision.
- Keep EF Core entities and IQueryable inside persistence boundaries. Project only required columns, use AsNoTracking for read-only queries, avoid N+1 queries, and make transaction/migration changes explicit.
- Enable nullable reference types, keep DTO/entity nullability honest, use async APIs end-to-end, pass CancellationToken to cancellable I/O, and avoid sync-over-async.
- Prefer constructor DI and small focused services. Do not hide ambient state, service-location, DateTime/network/filesystem calls, or cross-aggregate writes that make behavior nondeterministic.
- Cover domain invariants with focused unit tests and application/persistence behavior with xUnit plus the appropriate ABP integration fixture. Include authorization, validation, tenant isolation, cancellation, and database-boundary regressions when relevant.
- Keep secrets in the configured secret provider/environment, never committed settings or logs. Log stable identifiers and outcomes rather than tokens, credentials, or full sensitive payloads.
`,
  "typescript-nestjs": `# TypeScript/NestJS rules\n\n- Keep strict types and validate external input at controller boundaries.\n- Separate modules, application services, persistence, and transport concerns.\n- Test behavior with deterministic fixtures and avoid hidden global state.\n`,
  php: `# PHP rules\n\n- Keep request validation, authorization, and output encoding at application boundaries; never interpolate untrusted input into SQL, shell commands, paths, or HTML.\n- Follow the repository's framework and autoloading conventions, keep database transactions explicit, and preserve existing error/logging behavior without exposing secrets.\n- Test behavior with the project's established PHP test runner and use Composer only through declared scripts or commands.\n`,
  python: `# Python rules\n\n- Use type hints, explicit resource management, and small testable modules.\n- Validate external data and keep I/O at clear boundaries.\n`,
  "java-spring": `# Java/Spring rules\n\n- Keep transaction and persistence boundaries explicit.\n- Apply Bean Validation and Spring Security at the boundary; test with JUnit/Testcontainers where integration behavior matters.\n`,
  go: `# Go rules\n\n- Return and wrap errors with context; keep interfaces small.\n- Pass context.Context through cancellation-sensitive operations and test table-driven behavior.\n`,
  "react-web": `# React web rules\n\n- Preserve accessibility, keyboard navigation, and semantic HTML.\n- Treat client data as untrusted; test user behavior with Testing Library.\n`,
  vue: `# Vue rules\n\n- Keep components focused, props/events typed, and state ownership explicit.\n- Validate user input and test rendered behavior.\n`,
};

export function languageRule(language: string): string | undefined { return packs[language as LanguageId]; }

export interface SeedRulesOptions { root: string; languages: LanguageId[]; force?: boolean; }
export interface SeedRulesResult { paths: string[]; preserved: string[]; }
export function composeRules(languages: LanguageId[]): string { return [commonRules, ...[...new Set(languages)].sort((a, b) => a.localeCompare(b)).map((language) => packs[language])].join("\n"); }

export async function seedRules(options: SeedRulesOptions): Promise<SeedRulesResult> {
  const selected = [...new Set(options.languages)].sort((a, b) => a.localeCompare(b));
  const files = [{ path: ".harnix/spec/guides/common-rules.md", content: commonRules }, ...selected.map((language) => ({ path: `.harnix/spec/guides/${language}.md`, content: packs[language] }))];
  const paths: string[] = [], preserved: string[] = [];
  for (const file of files) {
    const absolute = await resolveSafeProjectPath(options.root, file.path);
    if (!options.force && await exists(absolute)) { preserved.push(file.path); continue; }
    await mkdir(join(absolute, ".."), { recursive: true }); await atomicWriteFile(absolute, file.content); paths.push(file.path);
  }
  return { paths, preserved };
}
async function exists(path: string): Promise<boolean> { try { await readFile(path); return true; } catch { return false; } }
