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
- `skill-reference-audit.ts`: `findDanglingSkillReferences(skills, program)` lists a `harnix-*` skill, a `--reference`
  topic, a `harnix <command>` or a `--flag` named in skill text that does not exist (used by
  `test/workflow/skill-reference-audit.test.ts`; routing floors live in `test/workflow/skill-routing-cases.json`). `test/workflow/reasoning-references.test.ts` pins the registered topic, the one pointer line and the promised rules of three reasoning references; `test/workflow/review-verify-wording.test.ts` pins the review `disclosure` reference, the "does not prove" rule of `harnix-verification-gap` and the replan wording of `harnix-implement --reference discoveries`.
- `test/workflow/output-redaction-performance.test.ts` runs `redactCheckOutput`, `redactSecrets` and every log rule on hostile 64 KB and 1 MB outputs (each must finish well under a second; the first version of the log rules took 12 seconds on 8 KB) and pins what the rules hide, what they leave alone and how a line over 4096 characters is cut; it sits in `test:gates`.
- `test/unit/core/doctor/skill-content-rules.test.ts` and `skill-content-finding.test.ts` pin the `skill-suspicious-content` doctor finding (each rule fires, every packaged skill stays clean, read-only); `test/workflow/skill-content-benign.test.ts` (warnings about the threats stay clean), `skill-content-performance.test.ts` (hostile input is scanned well under a second (budget 2 s under load)) and `skill-content-limits.test.ts` (file and finding limits with an `info` notice, any case of `.md`) cover the cross-cutting behavior; `test/workflow/test-gates-script.test.ts` checks that every token of the `test:gates` script is an existing test file; `test/workflow/skill-scan-exercise.test.ts` checks `scripts/exercise-skill-scan.mjs`, which runs the built `harnix doctor` on hostile and clean skills.
- `test/unit/core/workflow/git-advisories.test.ts`, `evidence-mode-advisory.test.ts`, `relevant-paths.test.ts` and `transition-advisories.test.ts` pin the transition advisories (early edits inside `relevantPaths`, a stale draft, a `code-only` run with no risk) with an injected Git runner; `test/workflow/advisories-exercise.test.ts` guards `scripts/exercise-advisories.mjs`, which runs the built CLI in a temporary Git project.
- `test/workflow/context-cost.test.ts` pins the hook context cost (the `Status` line is not compared, so a transition alone prints nothing on the next turn; `context.learningMax` limits and `0` hides the unreviewed notes; near-copy notes keep one), and `test/workflow/context-cost-exercise.test.ts` guards `scripts/exercise-context-cost.mjs` (two hook turns through the built CLI in a temporary project).
- `test/workflow/git-hygiene.test.ts` pins the managed `.harnix/.gitignore` and `.harnix/.gitattributes` (written by `init` and `update`, kept once edited, never the repository's own files, removed by `uninstall --purge`), `test/unit/templates/harnix/git-files.test.ts` their text, and `test/workflow/git-hygiene-exercise.test.ts` guards `scripts/exercise-git-hygiene.mjs` (init, repo-map, update twice, a user edit, doctor and purge through the built CLI in a temporary Git project); the doctor commands are pinned in `test/unit/core/doctor/project-runtime.test.ts`.
- `test/unit/core/workflow/scaffold-docs.test.ts` pins `workflow --scaffold-docs` (an unedited scaffold is left alone, a stale or hand-edited document is kept and refused with `--force`, a given UTF-8 text is written verbatim, a Lite task or one past planning is refused, no obligation changes) and `test/workflow/scaffold-docs-exercise.test.ts` guards `scripts/exercise-scaffold-docs.mjs` (the real CLI on a throwaway project, including a Vietnamese `--prd-file` byte for byte).
- `test/unit/core/workflow/technique-hint.test.ts` and `test/workflow/preflight-technique-hint.test.ts` pin the one fixed `techniqueHint` line and the thresholds that decide `harnix-sequential-thinking`; `test/workflow/technique-hint-exercise.test.ts` guards `scripts/exercise-technique-hint.mjs` (preflight through the built CLI in a temporary project); `test/workflow/test-gates-script.test.ts` also fails on a test file name run into the next one in `test:gates`.
- `temporary-repository.ts`: `useTemporaryRepositories()` disposable project roots.
- `temporary-user-home.ts`: disposable user homes. Tests never touch a real user profile.

## Imports and coverage

Import source and support modules through the `src/...` and `test/...` aliases (tsconfig `paths` plus the alias in
`vitest.config.ts`), for example `import { at } from "test/support/builders.js"`. Only same-directory `./x.js`
imports stay relative; ESLint forbids parent-relative `../` imports.

`pnpm test` runs `vitest run --coverage` (v8 provider). The floors in `vitest.config.ts` (lines and statements 96,
functions 98.8, branches 90.5) only ever rise: raise them when coverage improves, never lower one to make a change
pass. The per-test timeout is 20 seconds because filesystem-heavy workflow tests run in parallel.

Do not regenerate `test/workflow/behavior-snapshot.golden.json` to make a refactor pass.

`HARNIX_UPDATE_GOLDEN=1` writes `behavior-snapshot.golden.json` through the repository's Prettier (`test/support/golden-format.ts`), so regenerating unchanged code leaves the file byte for byte the same and a changed string shows as one diff line; review that diff before committing.

## Speed

Vitest runs with `pool: "forks"` and `isolate: false`: the files of one worker share its module graph instead of
importing it again, which saves about a third of the wall time. Every test therefore restores what it changes globally
(`process.chdir`, `process.exitCode`, spies) in `afterEach`, never mocks a whole module with `vi.mock` or `vi.doMock`
(an `afterEach` cannot undo it, so inject the dependency instead; `test/unit/test-structure.test.ts` enforces this), and
must not rely on a fresh module state; run
`pnpm exec vitest run --sequence.shuffle` to catch an order dependency.

`maxWorkers: 6` (of 12 cores) keeps the filesystem and process tests from competing for the machine: a file such as `test/unit/utils/git.test.ts` takes about 2 s alone but 29 s in a full run. Interleaved full runs gave 6 workers 75/76/80 s against 12 workers 82/79/80 s; the gain is small, so re-measure (3 runs each, one at a time) before changing it and never run two suites at once.

To find the slowest files, run `pnpm exec vitest run --reporter=json --outputFile=<file>` and sort `testResults` by
`endTime - startTime`. A file that is slow only in the full run is waiting for CPU; look for the work it repeats, such
as spawning `pnpm` or `prettier` (the version-sync API tests inject a no-op `format` for that reason).
