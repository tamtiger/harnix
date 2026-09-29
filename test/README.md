# Test suites

Every spec is a `*.test.ts` file; shared helpers live only in `test/support/`. The suites map to the
`pnpm test:*` scripts, and `pnpm test` runs all of them with coverage (the floor is in `vitest.config.ts`).

| Suite | Directory | Purpose | Naming |
| --- | --- | --- | --- |
| unit | `test/unit/` | One source module in isolation. | Mirrors `src`: `src/core/tasks/task-store.ts` is tested by `test/unit/core/tasks/task-store.test.ts`. |
| integration | `test/integration/` | Real commands against a disposable project. | `commands/<command>.test.ts` mirrors `src/commands/<command>.ts`; multi-command flows go in `scenarios/`. |
| workflow | `test/workflow/` | Workflow scenarios and repository contracts (architecture, docs, templates, CLI contract, behavior golden). | Named after the contract or scenario. |
| platform | `test/platform/` | Kiro, Antigravity, Codex and Claude Code global setup against an injected home. | Named after the platform surface. |
| safety | `test/safety/` | Path boundaries, isolated user home and release scanning. | Named after the boundary. |
| migration | `test/migration/` | Compatibility with older data (task v1/v2, `context.json`, `.harnix/roadmaps` to `.harnix/epics`). | Named after the data being migrated. |

`test/unit/test-structure.test.ts` is the only unit-level repository contract: it enforces this layout, the
400-line cap, use of the shared builders, direct coverage of every source module and a floor under the number
of tests and assertions. Its exception lists must only shrink, and every entry carries a reason.

## Shared builders (`test/support/`)

- `builders.ts`: `buildTaskV3`, `buildTaskV2`, `buildTaskV1`, `buildCheck`, `buildEvidence`, `buildCriterion`,
  `buildEpic`, `createTestProject`, plus the fixed clock and zone (`at`, `fixedClock`, `TEST_TIMEZONE`).
- `temporary-repository.ts`: `useTemporaryRepositories()` disposable project roots.
- `temporary-user-home.ts`: disposable user homes. Tests never touch a real user profile.

## Imports and coverage

Import source and support modules through the `src/...` and `test/...` aliases (tsconfig `paths` plus the alias in
`vitest.config.ts`), for example `import { at } from "test/support/builders.js"`. Only same-directory `./x.js`
imports stay relative; ESLint forbids parent-relative `../` imports.

`pnpm test` runs `vitest run --coverage` (v8 provider). The floors in `vitest.config.ts` (lines and statements 93.1,
functions 98.1, branches 86.8) only ever rise: raise them when coverage improves, never lower one to make a change
pass. The per-test timeout is 20 seconds because filesystem-heavy workflow tests run in parallel.

Do not regenerate `test/workflow/behavior-snapshot.golden.json` to make a refactor pass.
