# Test suites

Every spec is a `*.test.ts` file; shared helpers live only in `test/support/`. The suites map to the
`pnpm test:*` scripts, and `pnpm test` runs all of them with coverage (the floor is in `vitest.config.ts`).

| Suite       | Directory           | Purpose                                                                                                     | Naming                                                                                                    |
| ----------- | ------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| unit        | `test/unit/`        | One source module in isolation.                                                                             | Mirrors `src`: `src/core/tasks/task-store.ts` is tested by `test/unit/core/tasks/task-store.test.ts`.     |
| integration | `test/integration/` | Real commands against a disposable project.                                                                 | `commands/<command>.test.ts` mirrors `src/commands/<command>.ts`; multi-command flows go in `scenarios/`. |
| workflow    | `test/workflow/`    | Workflow scenarios and repository contracts (architecture, docs, templates, CLI contract, behavior golden). | Named after the contract or scenario.                                                                     |
| platform    | `test/platform/`    | Kiro, Antigravity, Codex, Claude Code, OpenCode and Cursor global setup against an injected home.           | Named after the platform surface.                                                                         |
| safety      | `test/safety/`      | Path boundaries, isolated user home and release scanning.                                                   | Named after the boundary.                                                                                 |
| migration   | `test/migration/`   | Compatibility with older data (task v1/v2, `context.json`, `.harnix/roadmaps` to `.harnix/epics`).          | Named after the data being migrated.                                                                      |

`test/unit/test-structure.test.ts` is the only unit-level repository contract: it enforces this layout, the
400-line cap, use of the shared builders, direct coverage of every source module and a floor under the number
of tests and assertions. Its exception lists must only shrink, and every entry carries a reason.

## Placement and Mirroring Rules

Harnix strictly enforces a 1:1 file mirroring structure in `test/unit/test-structure.test.ts`:

1. **Unit tests (`test/unit/`)**: Every spec must 1:1 mirror its corresponding implementation file in `src/`.
   - Pattern: `src/<module-path>.ts` <-> `test/unit/<module-path>.test.ts`
   - Example: `src/utils/check-runner.ts` must be tested in `test/unit/utils/check-runner.test.ts`.
   - Never create arbitrary unit test filenames or grouped test files that do not exist in `src/`.
2. **Command tests (`test/integration/commands/`)**: Every spec must 1:1 mirror a command module in `src/commands/`.
   - Pattern: `src/commands/<command>.ts` <-> `test/integration/commands/<command>.test.ts`
3. **Integration scenarios (`test/integration/scenarios/`)**: Multi-command end-to-end integration workflows.
4. **Shared support and fixtures (`test/support/`)**: Any helper, mock, fixture generator, or reusable utility that is NOT a `*.test.ts` file MUST live exclusively under `test/support/` (e.g., `test/support/learning-fixtures.ts`, `test/support/workflow-fixtures.ts`). Non-test files placed anywhere else under `test/` will fail the test suite structure check.
5. **Agent Task Safety Tip**: Placing a test file in an incorrect path before saving input globs in a task can lead to digest freeze and task cancellation. Always verify test file placement against `test/unit/test-structure.test.ts` before freezing verification digests.

## Shared builders (`test/support/`)

- `builders.ts`: `buildTaskV3`, `buildTaskV2`, `buildTaskV1`, `buildCheck`, `buildEvidence`, `buildCriterion`,
  `buildEpic`, `createTestProject`, plus the fixed clock and zone (`at`, `fixedClock`, `TEST_TIMEZONE`).
- `temporary-repository.ts`: `useTemporaryRepositories()` disposable project roots.
- `temporary-user-home.ts`: disposable user homes. Tests never touch a real user profile.

## Imports and coverage

Import source and support modules through the `src/...` and `test/...` aliases (tsconfig `paths` plus the alias in
`vitest.config.ts`), for example `import { at } from "test/support/builders.js"`. Only same-directory `./x.js`
imports stay relative; ESLint forbids parent-relative `../` imports.

`pnpm test` runs `vitest run --coverage` (v8 provider). The floors in `vitest.config.ts` (lines and statements 95,
functions 98.6, branches 89) only ever rise: raise them when coverage improves, never lower one to make a change
pass. The per-test timeout is 20 seconds because filesystem-heavy workflow tests run in parallel.

Do not regenerate `test/workflow/behavior-snapshot.golden.json` to make a refactor pass.

## Speed

Vitest runs with `pool: "forks"` and `isolate: false`: the files of one worker share its module graph instead of
importing it again, which saves about a third of the wall time. Every test therefore restores what it changes globally
(`process.chdir`, `process.exitCode`, spies and mocks) in `afterEach`, and must not rely on a fresh module state; run
`pnpm exec vitest run --sequence.shuffle` to catch an order dependency.

To find the slowest files, run `pnpm exec vitest run --reporter=json --outputFile=<file>` and sort `testResults` by
`endTime - startTime`. A file that is slow only in the full run is waiting for CPU; look for the work it repeats, such
as spawning `pnpm` or `prettier` (the version-sync API tests inject a no-op `format` for that reason).
