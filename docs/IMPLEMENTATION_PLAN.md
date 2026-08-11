# Harnix Implementation Plan

## 1. Mục tiêu

Xây dựng Harnix end-to-end dưới dạng **một public npm package** `@tamtiger/harnix`, một executable `harnix`, project data `.harnix/`, hỗ trợ đúng Kiro, Antigravity và Codex. Harnix phải biến yêu cầu thành spec/task có cấu trúc, nạp context có ngân sách, kiểm chứng bằng fresh evidence và duy trì project knowledge mà không làm phình consumer repository.

Plan này là checkpoint bắt buộc trước code. Checkpoint đã pass tại Phase 0 sau khi:

1. `docs/HARNIX_PRD.md` và `docs/HARNIX_WORKFLOW.md` được chuẩn hóa hoàn toàn sang Harnix.
2. Toàn bộ PRD/workflow/plan/research/mapping/baseline được review và schema contracts được khóa.
3. Active Git repository được xác minh là Harnix sạch, provenance upstream được giữ bằng frozen records và mọi tài liệu người dùng được bảo toàn.

## 2. Global constraints

- Product: **Harnix**.
- Repository: `https://github.com/tamtiger/harnix.git`; active repo chỉ có `origin`. Trellis/ECC/Superpowers tồn tại dưới dạng frozen external research checkouts/records, không phải active remotes.
- Package/executable: `@tamtiger/harnix` / `harnix`.
- Project data/generator/skills: `.harnix/` / `harnix` / `harnix-*`.
- TypeScript ESM, Node.js `>=18`, pnpm, Commander.js, Inquirer, tsup, Vitest.
- Một publishable `package.json`; không workspace/core package phụ.
- Chỉ Kiro, Antigravity, Codex.
- Runtime nằm trong package; không sinh runtime scripts vào consumer.
- User-modified project/platform files thắng packaged defaults.
- Không telemetry, daemon, hosted service, silent network, default MCP, global config mutation.
- Không tự commit, branch, worktree, merge, push hoặc PR; subagent không phải dependency.
- Default uninstall giữ data; purge cần preview, confirmation và safe-root verification.
- AGPL-3.0/notices cho derived Trellis code; MIT attribution cho ECC/Superpowers adaptations.

## 3. Kiến trúc đích

```text
harnix/
├── src/
│   ├── core/
│   │   ├── config/          # schema, explicit migrations
│   │   ├── tasks/           # task PRD/state/context references
│   │   ├── context/         # rank, dedupe, budget, disclosure
│   │   ├── journal/         # entries, search, learning candidates
│   │   └── project.ts       # project-level service boundary
│   ├── commands/            # init, setup, update, upgrade, uninstall, mem, doctor
│   ├── configurators/       # kiro.ts, antigravity.ts, codex.ts only
│   ├── templates/           # harnix + platform content
│   ├── rules/               # common + seven selected language/framework packs
│   ├── skills/              # five core + research/debug optional
│   ├── agents/              # optional roles only
│   ├── migration/           # discover, preview, plan, apply, verify, cleanup
│   ├── utils/               # paths, detection, hashing, atomic/managed files, process
│   ├── cli.ts
│   └── index.ts
├── test/
│   ├── unit/
│   ├── integration/
│   ├── workflow/
│   ├── migration/
│   ├── platform/
│   ├── safety/
│   └── support/
├── docs/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
└── pnpm-lock.yaml
```

Dependency direction:

```text
commands/configurators/migration -> core -> utils/pure types
commands -> terminal UI
configurators -> templates/rules/skills
core -X-> Commander/Inquirer/platform templates
```

Filesystem, clock, process runner, version lookup và prompt dependencies phải inject được để integration tests không gọi network/install hoặc interactive terminal thật.

## 4. Frozen state and schema contracts

Các contract trong mục này là normative cho implementation v1. Thay đổi field, enum, path hoặc transition phải cập nhật PRD/workflow, migration và tests trong cùng change.

### 4.1 `.harnix/config.yaml`

```ts
type LanguageId =
  | "csharp-dotnet-abp"
  | "typescript-nestjs"
  | "python"
  | "java-spring"
  | "go"
  | "react-web"
  | "vue";

type PlatformId = "kiro" | "antigravity" | "codex";

interface PackageConfig {
  path: string;              // normalized repo-relative POSIX path; "." for root
  languages: LanguageId[];   // unique, lexicographically sorted
}

interface HarnixConfigV1 {
  generator: "harnix";
  schemaVersion: 1;
  developer: string;         // workspace ID matching ^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$
  languages: LanguageId[];   // project union, unique and sorted
  packages: PackageConfig[]; // unique by path and sorted by path
  platforms: PlatformId[];   // unique and sorted
  context: {
    maxCharacters: number;   // positive integer, default 24000
    tokenApproximation: number; // positive number, default 4 chars/token
  };
  runtime: {
    research: "conditional";
    fullContext: boolean;
  };
}
```

YAML serialization dùng đúng shape trên, deterministic key order và LF trong golden fixtures. Schema migration explicit `N -> N+1`; future versions bị reject. Compatible unknown user keys được round-trip preserve nhưng core logic chỉ đọc known fields. Arrays duplicate, absolute/package-escape path, developer không khớp safe ID pattern và invalid enum fail validation trước write.

### 4.2 Managed manifest

File: `.harnix/.template-hashes.json`.

```ts
interface ManagedEntryV1 {
  path: string;             // POSIX-normalized repo-relative, unique
  sourceId: string;         // stable packaged template/rule/skill identifier
  scope: "project" | "kiro" | "antigravity" | "codex";
  generatedHash: string;    // lowercase SHA-256 of normalized content
  generatorVersion: string;
}

interface ManagedManifestV1 {
  generator: "harnix";
  schemaVersion: 1;
  entries: ManagedEntryV1[]; // sorted by path
}
```

Manifest replacement là atomic. Ownership state được suy ra từ desired template, stored entry và disk hash; không persist transient state. Không track tasks/journals. Reject duplicate/absolute/traversal keys, external symlinks, invalid hash và corrupt/future manifest. Legacy hash namespace không được tin; migration re-baseline từ disk/template evidence.

### 4.3 Task record and workflow state

File: `.harnix/tasks/<task-id>/task.json`; `<task-id>` là lowercase `YYYYMMDD-HHMMSS-<slug>`, collision thêm deterministic numeric suffix. Active task được lưu bằng repo-relative task ID trong `.harnix/tasks/.active`, atomic replace; completed task xóa pointer chỉ khi pointer vẫn trỏ đúng task.

```ts
type TaskMode = "lite" | "full";
type TaskStatus = "planning" | "ready" | "in_progress" | "verifying" | "blocked" | "completed";
type WorkflowCheckpoint =
  | "triage" | "planning" | "ready" | "implementing"
  | "debugging" | "replan" | "verifying" | "finishing";
type CriterionStatus = "pending" | "met" | "waived";
type EvidenceResult = "pass" | "fail" | "skipped";

interface AcceptanceCriterionV1 {
  id: string;
  text: string;
  status: CriterionStatus;
  evidenceIds: string[];
  waiverReason?: string;
}

interface ValidationCheckV1 {
  id: string;
  description: string;
  command?: string;         // omitted for a deterministic non-command inspection
  scope: "focused" | "full";
  required: boolean;
}

interface EvidenceRecordV1 {
  id: string;
  checkId?: string;
  recordedAt: string;       // ISO-8601
  result: EvidenceResult;
  exitCode?: number;        // required when command exists
  summary: string;
  artifactPaths: string[];  // normalized repo-relative, no machine paths
}

interface TaskRecordV1 {
  generator: "harnix";
  schemaVersion: 1;
  id: string;
  title: string;
  mode: TaskMode;
  status: TaskStatus;
  checkpoint: WorkflowCheckpoint;
  goal: string;
  nonGoals: string[];
  acceptanceCriteria: AcceptanceCriterionV1[];
  relevantPaths: string[];
  relevantSpecs: string[];
  validationPlan: ValidationCheckV1[];
  evidence: EvidenceRecordV1[];
  blocker?: { kind: "decision" | "authority" | "credential" | "external" | "repository"; summary: string; nextAction: string; resumeStatus: "planning" | "ready" | "in_progress" | "verifying" };
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}
```

Legal persisted transitions: `planning -> ready -> in_progress -> verifying -> completed`; any non-completed state may enter `blocked` and resume only to its recorded prior status. `debugging`, `replan` and `finishing` are checkpoints, not additional persisted statuses. Illegal jump, malformed/future record hoặc acceptance/evidence reference lỗi fail closed. Full task bắt buộc `prd.md` + `plan.md`; `design.md`, `research/` và `context.json` conditional. Lite giữ toàn bộ minimum trace trong `task.json`. Validation invariants: `met` criterion cần ít nhất một existing evidence ID; `waived` cần non-empty `waiverReason`; command evidence cần integer `exitCode`; `blocked` cần blocker + matching `resumeStatus`; `completed` cần `completedAt`, không blocker và mọi required criterion `met|waived`.

### 4.4 Context manifest

Conditional file: `.harnix/tasks/<task-id>/context.json`. Lite có thể chỉ dùng `relevantPaths`/`relevantSpecs` trong task record.

```ts
interface ContextEntryV1 {
  path: string;             // normalized repo-relative
  reason: string;
  priority: number;         // integer; higher loads first
  pinned: boolean;
  states: Array<"planning" | "implementing" | "debugging" | "verifying" | "finishing">;
  contentHash?: string;     // optional change-detection hint, never trust boundary
}

interface ContextManifestV1 {
  generator: "harnix";
  schemaVersion: 1;
  taskId: string;
  maxCharacters: number;
  entries: ContextEntryV1[]; // dedupe by normalized path, sort pinned/priority/path
  omitted: Array<{ path: string; reason: "budget" | "duplicate" | "missing" | "unsafe" }>;
}
```

Deterministic base score là pin `1000`, explicit task/acceptance reference `500`, active package/path `250`, detected language/framework `100`, cross-project guide `25`; applicable signals cộng dồn, sau đó sort pinned → score/priority descending → normalized path ascending. Context loader không execute included text, không follow external symlink và luôn disclose omitted entries. Explicit full-context bypasses budget only, không bypass path safety/dedupe/source listing.

### 4.5 Journal and learning

Journal path: `.harnix/workspace/<developer>/journal/YYYY-MM-DD.jsonl`; một UTF-8 JSON object mỗi line, append bằng locked/atomic strategy phù hợp platform. Malformed lines được report và skip, không làm mất valid entries.

```ts
interface LearningCandidateV1 {
  id: string;
  statement: string;
  sourceTaskIds: string[];
  evidenceIds: string[];
  occurrences: number;
  confidence: number;       // 0..1
  status: "candidate" | "approved" | "promoted" | "rejected";
}

interface JournalEntryV1 {
  generator: "harnix";
  schemaVersion: 1;
  id: string;
  recordedAt: string;
  developer: string;
  taskId?: string;
  kind: "checkpoint" | "completion" | "learning" | "note";
  summary: string;
  evidenceIds: string[];
  learning?: LearningCandidateV1;
}
```

Candidate normalization dedupe `sourceTaskIds`/`evidenceIds`; `occurrences` bằng số source task độc lập. Deterministic confidence là `min(1, 0.4 + 0.2*min(distinctTasks,2) + 0.1*min(distinctEvidence,2))`. Không có explicit approval thì chỉ eligible để đề xuất khi distinct tasks >=2, distinct evidence >=2 và confidence >=0.8; write vào spec vẫn cần finish/review action rõ và luôn reviewable. Không hidden/global promotion.

### 4.6 Doctor JSON

```ts
interface DoctorReportV1 {
  schemaVersion: 1;
  generator: "harnix";
  ok: boolean;
  summary: { errors: number; warnings: number; fixed: number };
  findings: Array<{
    code: string;
    severity: "error" | "warning" | "info";
    path?: string;
    message: string;
    fixable: boolean;
  }>;
}
```

Finding order là severity/code/path deterministic; secret values luôn redact. Exit `0` clean, `1` có warning/error finding, `2` invalid usage, corrupt root state hoặc internal deterministic failure. `--fix` vẫn trả report cùng schema sau repair attempt.
### 4.7 Internal platform-hook protocol

`harnix internal context --platform <kiro|antigravity|codex>` là packaged hidden subcommand, không xuất hiện trong public help và không làm tăng public seven-command contract. Nó:

1. đọc hook event JSON từ stdin khi có, lấy `cwd` đã validate hoặc fallback process cwd;
2. resolve repository/task state bằng cùng safe path APIs;
3. load bounded ranked context, không network và không mutation;
4. exit `0` với empty output khi project chưa init; invalid/corrupt Harnix state trả concise redacted stderr + non-zero;
5. không echo prompt, secret, credential hoặc absolute machine path; stdout không vượt `config.context.maxCharacters` và luôn disclose truncation.

Platform output:

- **Kiro:** UTF-8 Markdown/plain text. Frozen hook is `.kiro/hooks/harnix-context.kiro.hook` with `version: "1.0.0"`, `enabled: true`, `when: { type: "promptSubmit" }`, `then: { type: "runCommand", command: "harnix internal context --platform kiro" }`. Kiro adds successful stdout to agent context.
- **Codex:** one `.codex/hooks.json` `UserPromptSubmit` command handler: POSIX command `harnix internal context --platform codex`, Windows override `harnix.exe internal context --platform codex`, `timeout: 5`, `additionalContextLimit: 2500`. Stdout is JSON `{ "hookSpecificOutput": { "hookEventName": "UserPromptSubmit", "additionalContext": "..." } }`; JSON escaping and hard output cap are tested.
- **Antigravity:** no generated hook in v1. `GEMINI.md`/skills instruct pull-based loading and may invoke the same hidden command explicitly; absence of `agy` does not prevent offline template generation.

Hook commands are generated constants, never concatenated with user input. Platform hook fixtures cover success, no-project, corrupt state, Unicode/spaces, nested worktree, bounded output and Windows executable resolution.
### 4.8 Common CLI result semantics

Mọi public command dùng stderr cho actionable error/warning và stdout cho requested data/output. Exit `0` là success/clean intentional no-op/dry-run; exit `1` là operation hoặc diagnostic hoàn tất nhưng có actionable finding/conflict/failure; exit `2` là invalid usage/config/schema/root hoặc deterministic internal failure. Không in secret values, stack trace mặc định hoặc machine-specific absolute path trong generated/machine-readable output. `--json` (nơi được hỗ trợ) emit đúng một JSON document; interactive prompts bị disable khi `--yes` hoặc non-TTY và thiếu required value phải fail thay vì treo.
## 5. Phase 0 — Documentation và baseline checkpoint

### Task 0.1: Chuẩn hóa PRD

**Modify:** `docs/HARNIX_PRD.md`; **create:** `docs/HARNIX_WORKFLOW.md`

- [x] Đổi public identity Trellis Pro thành Harnix.
- [x] Đổi monorepo/two-package thành single-package architecture.
- [x] Đổi CLI/path/template namespace sang Harnix.
- [x] Thêm Codex, migration, doctor, context budget, learning và safety requirements từ master prompt.
- [x] Giữ mục nguồn gốc Trellis/PRD history và link repository Harnix.
- [x] Scan PRD để Trellis chỉ còn ở attribution/migration/history.
- [x] Review workflow Trellis/Superpowers và khóa canonical state machine, gates, artifacts, rollback, finish/continue semantics.

### Task 0.2: Reconcile clean Harnix Git baseline

**Inspect:** Git root/branch/remotes, working tree, `docs/**`, frozen upstream records.

- [x] Repository hiện là Git Harnix mới trên branch `main`, chỉ có remote `origin = https://github.com/tamtiger/harnix.git`; không còn Trellis HEAD/upstream hoặc mass deletion state.
- [x] Trellis/ECC/Superpowers provenance được giữ bằng frozen SHA/URL/license trong `UPSTREAM_BASELINE.md`, không cần giữ Trellis Git metadata trong active repository.
- [x] Xác minh working tree chưa có production scaffold; chỉ `docs/` là untracked user-owned baseline.
- [x] Stale-branding scan sẽ phân biệt allowed attribution/research/migration/license/history với forbidden generated/public output.

### Task 0.3: Documentation and implementation-readiness gate

- [x] Review `HARNIX_PRD`, `HARNIX_WORKFLOW`, `UPSTREAM_BASELINE`, `HARNESS_RESEARCH`, `UPSTREAM_MAPPING` và plan này.
- [x] Kiểm repository URL, frozen SHA/license/date, platform versions và footprint arithmetic.
- [x] Khóa config/manifest/task/context/journal/doctor schemas cùng workflow transitions.
- [x] Khóa platform surface contract trước configurator implementation.
- [x] Định nghĩa executable package scripts cho acceptance, smoke, performance, footprint và release scan.
- [x] Xác nhận không có production code/scaffold trước Phase 1.

**Exit criteria:** documentation contracts nhất quán; user request “update toàn bộ để có thể implement” cho phép bắt đầu Phase 1 sau khi update này được verify. Không cần approval lặp lại giữa phase trừ khi xuất hiện product decision/authority blocker mới.
## 6. Phase 1 — Single-package foundation, init và basic setup

### Task 1.0: Freeze platform adapter contracts

**Inputs:** local verified installations on 2026-08-05 and official/current platform documentation where available.

- [x] Kiro baseline: `kiro-cli-chat 2.14.2`; project output is `.kiro/skills/harnix-*/SKILL.md`, `.kiro/steering/harnix.md` and one `.kiro/hooks/harnix-context.kiro.hook`. Frozen context hook uses `promptSubmit -> runCommand`; successful stdout is agent context.
- [x] Antigravity baseline: `agy 1.1.1`; public flag/name is `--antigravity`, physical project namespace is `GEMINI.md` + `.gemini/skills/harnix-*`. Release v1 does not generate Antigravity settings/hooks because no authoritative project-local schema has been verified; user-level `.gemini` state remains out of scope.
- [x] Codex baseline: `codex-cli 0.139.0`; project output is a managed root `AGENTS.md` block, `.agents/skills/harnix-*`, structurally merged Harnix-owned `.codex/config.toml` keys and exactly one official-schema `.codex/hooks.json` `UserPromptSubmit` handler with `commandWindows`.
- [x] Platform version drift is a revalidation trigger, not permission to silently change generated schema; record any deviation with date/source and update snapshots.


### Task 1.1: Package/tooling scaffold

**Create:** root `package.json`, TypeScript/tsup/Vitest/ESLint config, `src/{cli,index}.ts`, license/notice/readme.

- [x] Write packaging invariant test first: exactly one publishable `package.json`, no workspace file, one `harnix` bin.
- [x] Scaffold package with Node >=18 and ESM.
- [x] Lock package scripts: `build`, `lint`, `typecheck`, `test`, `test:unit`, `test:integration`, `test:migration`, `test:platform`, `test:workflow`, `test:safety`, `test:acceptance`, `pack:check`, `smoke:tarball`, `measure:init`, `measure:footprint`, `scan:release`.
- [x] Phase 1: `test:acceptance` orchestrates the implemented unit/integration/migration/platform/workflow/safety suites; `pack:check` produces exactly one tarball under `.artifacts/` without global mutation.
- [x] Phase 4 extension: add clean/seeded `doctor --json` fixtures to `test:acceptance`, then have smoke/release scripts consume the checked tarball and isolated fixtures.
- [x] Build minimal CLI help and non-zero usage errors.
- [x] Verify `pnpm install --frozen-lockfile --ignore-scripts`, build, lint, typecheck and minimal tests (pnpm 11 no-workspace policy).

### Task 1.2: Root/path and atomic primitives

**Create:** `src/utils/{paths,atomic-write}.ts`

**Tests:** `test/unit/{paths,atomic-write}.test.ts`

- [x] RED tests for nested Git root, worktree root, Unicode/spaces, non-Git fallback, traversal and symlink/junction escape.
- [x] Implement Node path APIs + argument-safe Git lookup; never shell-concatenate paths.
- [x] RED tests for atomic success, interrupted replacement and temp cleanup.
- [x] Implement sibling temp write + atomic replacement.

### Task 1.3: Detection

**Create:** `src/utils/detection.ts`; fixture repositories.

- [x] RED tests for C#/.NET/ABP, NestJS, Python, Java/Spring, Go, React, Vue and monorepo.
- [x] Test ignored `node_modules/vendor/bin/obj/dist/build` trees.
- [x] Detect package manager and available verification scripts without executing them.
- [x] Return deterministic sorted languages/packages/commands.

### Task 1.4: Config schema and init

**Create:** `src/core/config/**`, `src/commands/init.ts`, Harnix base templates.

- [x] RED config tests implement exact 4.1 types/invariants, valid/corrupt/future schemas and compatible unknown-key round-trip preservation.
- [x] RED CLI tests for `--yes`, `--user`, `--languages`, interactive edit and idempotence.
- [x] Init creates the approved `.harnix` tree plus a small root `AGENTS.md` bootstrap for AI agents; no runtime scripts or platform hook/settings are created.
- [x] Existing `AGENTS.md`, specs/config/tasks/journals remain untouched; the bootstrap is managed conservatively and preserves user edits.
- [x] Performance test uses a representative local fixture and requires <5 seconds.

### Task 1.5: Legacy preview (superseded for runtime)

**Create:** `src/migration/discovery.ts`, preview model.

- [x] Historical compatibility code and tests remain for provenance.
- [x] Current `init` ignores legacy markers and always manages only `.harnix`.
- [x] `--dry-run` output is stable and machine-testable.

Product decision supersession: Harnix no longer exposes legacy detection or migration through the runtime init/doctor flow. Existing Trellis files remain untouched.

### Task 1.6: Basic Kiro/Codex setup from frozen contracts

**Create:** `src/commands/setup.ts`, configurator interface, minimal `kiro.ts`/`codex.ts`, templates and schema snapshots.

- [x] Require at least one platform flag; accept multiple flags; `--antigravity` is recognized but its writer lands in Task 3.5.
- [x] Validate config before any platform write.
- [x] Kiro emits exactly the Task 1.0 project paths and one schema-valid `.kiro.hook`; selected-language output only.
- [x] Codex preserves arbitrary `AGENTS.md` outside managed markers, emits valid repo skills and uses one `.codex/hooks.json` representation.
- [x] No configurator writes user-level state, machine paths, credentials or runtime copies.
- [x] Rerun produces byte-identical managed output.

**Phase 1 gate:** [x] focused unit/integration tests green; build/lint/typecheck green; no unsupported public branding in new output. Verified on 2026-08-05 with `pnpm install --frozen-lockfile --ignore-scripts`, build, lint, typecheck, 44 tests, `test:acceptance`, `pack:check`, branding scan and `git diff --check`.

## 7. Phase 2 — Core workflow data, context và managed ownership

### Task 2.1: Versioned managed manifest

**Create:** `src/utils/{hashing,managed-files}.ts`

- [x] RED schema + ownership-state tests implement 4.2: create/update/preserve/deleted/obsolete unchanged/obsolete modified.
- [x] Normalize CRLF for content hash while preserving desired output bytes.
- [x] Reject corrupt/future manifest, unsafe keys and external symlinks.
- [x] Atomic manifest replacement and rollback tests.

### Task 2.2: Task state

**Create:** `src/core/tasks/**`

- [x] Implement exact 4.3 task/criterion/validation/evidence/blocker schema and `HARNIX_WORKFLOW.md` semantics; do not add implicit Git fields.
- [x] Test create/read/update/archive, malformed/future state and active task resolution.
- [x] RED transition/gate tests: planning → ready → in_progress → verifying → completed; blocked resume; debugging/replan checkpoint; illegal jump fail closed.
- [x] Full mode adds `prd.md`/`plan.md`, conditional `design.md`/`research`; Lite does not create empty ceremony files.
- [x] No Git branch/commit/PR fields required by core behavior.

### Task 2.3: Context ranking and budgeting

**Create:** `src/core/context/**`

- [x] RED ranking tests lock 4.4 additive scores, tie-break, pin, task reference, active package/path, language/framework and guide priority.
- [x] RED tests for dedupe, deterministic ties, budget boundary and omitted-files disclosure.
- [x] Persist optional per-state `context.json`; Lite may keep small relevant-path refs in `task.json` without a second artifact.
- [x] Explicit full-context override bypasses budget but retains source list.
- [x] Context output is bounded and never executes included text.

### Task 2.4: Journal and learning

**Create:** `src/core/journal/**`, `learning.ts`

- [x] Test newest-first search, query/user/limit, Unicode/spaces, missing workspace and malformed entries.
- [x] Implement exact 4.5 candidate dedupe, occurrence, confidence formula and proposal threshold.
- [x] Test recurrence/explicit promotion gates and reviewable spec write.
- [x] No automatic hidden/global promotion.

### Task 2.5: ECC/Harnix rule seeding

**Create:** concise common + target packs under `src/rules/**` and attribution metadata.

- [x] Golden tests assert only detected relevant packs are emitted.
- [x] Framework pack precedence over common.
- [x] React web excludes React Native.
- [x] Attribution scan covers copied/adapted MIT content.

**Phase 2 gate:** [x] all Phase 2 focused tests green; init/update idempotent; modified user files preserved; context disclosure verified. Verified with 53 unit tests, full acceptance suites, typecheck, lint, and diff check.

## 8. Phase 3 — Workflow skills and platform parity

### Task 3.1: Core skills

**Create:** `src/templates/harnix/workflow.md` từ canonical doc; `harnix-brainstorm`, `harnix-implement`, `harnix-check`, `harnix-finish-work`, `harnix-continue` sources.

- [x] Generated `.harnix/workflow.md` giữ đúng state/transition/gate semantics và được managed-until-edited.
- [x] Eval Bypass không tạo task; Lite/Full tạo đúng artifact contract.
- [x] Eval lite/full/ambiguous/forced routing.
- [x] Full output contains acceptance criteria, material-unknown research decision and decision-complete plan.
- [x] Explicit implementation request proceeds after ready gate without duplicate approval; plan-only request stops at `ready`.
- [x] Implement loads scoped context and records checkpoints.
- [x] Check enforces compliance stage before quality/security stage.
- [x] Finish requires fresh verification, journals evidence and never commits.
- [x] Continue routes from persisted status/checkpoint, loads minimum relevant state and fails closed on corrupt/future task state.

### Task 3.2: Research/debug skills

**Create:** `harnix-research`, `harnix-debug`.

- [x] Eval research activates only for defined material unknowns.
- [x] Research findings retain source/date/task attribution.
- [x] Debug eval enforces reproduce/evidence/root cause/single hypothesis/regression sequence.
- [x] Three failed hypotheses trigger architecture reassessment.

### Task 3.3: Adaptive TDD and verification evals

- [x] Behavior change routes RED–GREEN–REFACTOR.
- [x] Docs/trivial wiring/generated snapshot exception records reason and alternate verification.
- [x] Stale or inferred output cannot satisfy completion.
- [x] Partial verification cannot support a broader claim; evidence stores check, time, result/exit and summary.
- [x] YAGNI prevents unrequested framework/generalization.

### Task 3.4: Codex native parity

**Create:** finalized `src/configurators/codex.ts`, Codex templates/tests.

- [x] Preserve user `AGENTS.md`; managed markers never duplicate.
- [x] Repo skills at `.agents/skills/harnix-*` pass frontmatter/schema tests.
- [x] Structurally merge only Harnix-owned `.codex/config.toml` keys.
- [x] Use exactly one current hook representation; test bounded output, safe commands, Windows override, trust guidance and nested worktree root.
- [x] Optional roles cannot become core dependency.
- [x] Preserve user-owned `.codex` files and unrelated config.

### Task 3.5: Kiro and Antigravity parity

- [x] Revalidate Task 1.0 snapshots only when installed version/current authoritative behavior differs; record date/source for deviations.
- [x] Preflight `agy --version`; missing executable yields an actionable readiness warning, while fixture/injected runner keeps tests deterministic.
- [x] Antigravity emits only managed project `GEMINI.md` and `.gemini/skills/harnix-*`; do not generate unverified settings/hooks or touch any user-level `.gemini` state.
- [x] Kiro finalized output remains schema-compatible with the frozen `.kiro.hook` fixture.
- [x] Generate equivalent core/optional workflow behavior and relevant rules across both adapters.
- [x] Multi-platform setup has no path collision or duplicate execution; no absolute machine path appears in output.

### Task 3.6: Remove stale upstream surfaces

- [x] Remove unsupported adapters, agents, scripts, packages, imports and tests.
- [x] Add negative scans for forbidden branding/surfaces.
- [x] Preserve allowed research/migration/license occurrences only.

**Phase 3 gate:** [x] workflow evals and platform snapshots green; setup parity/idempotence green; public/output branding clean. Verified with fresh acceptance, typecheck, lint, and diff check.

## 9. Phase 4 — Lifecycle, migration, doctor và release polish

### Task 4.1: Update

- [x] Materialize desired template set from config/platform/language.
- [x] Apply managed ownership state machine.
- [x] Report user-deleted files and require explicit restore path.
- [x] Never touch tasks/journals/unrelated files.

### Task 4.2: Upgrade

- [x] Report installed and available versions.
- [x] Present safe npm upgrade path for `@tamtiger/harnix`.
- [x] Use `execFile` argument arrays and injected version/network/process dependencies.
- [x] Tests prove no network/install process is invoked unless injected fake permits it.

### Task 4.3: Uninstall/purge

- [x] Default removes unchanged managed platform files/blocks only.
- [x] Preserve `.harnix` data, modified injections and user files.
- [x] Purge lists exact targets and requires confirmation unless intentional `--yes`.
- [x] Refuse filesystem/repo unsafe roots and external symlinks.
- [x] Legacy sources require separate verified cleanup option.

### Task 4.4: Safe migration

Historical implementation retained for provenance and isolated migration tests; it is not part of the public Harnix runtime path.

- [x] Preview discovery and conflict plan.
- [x] Stage copy/transform into temporary sibling.
- [x] Re-baseline namespace/hash ownership conservatively.
- [x] Verify config/spec/task/journal counts/hashes before atomic activation.
- [x] On failure remove only owned staging and leave legacy source unchanged.
- [x] Cleanup only after explicit option and verified migration.

### Task 4.5: Mem

- [x] Query/user/limit/json contract and stable JSON.
- [x] Missing/malformed/Unicode cases degrade gracefully.
- [x] Include candidate confidence/evidence without promotion.

### Task 4.6: Doctor/fix

- [x] Implement deterministic checks: schemas, manifest ownership, missing/modified/obsolete, duplicate/legacy injections, skill frontmatter, hooks, trust drift, unsafe paths, attribution, platform drift, secrets, permissions and injection-prone commands.
- [x] Redact secret values.
- [x] `--fix` emits plan then repairs only safe managed issues.
- [x] Never modify specs/tasks/journals/secrets/sensitive permissions/user-modified files.
- [x] Stable 4.6 JSON ordering/redaction and 4.8 exit codes locked by fixtures.

### Task 4.7: Packaging, performance và footprint

- [x] Implement and verify `pack:check`; tarball contains only intended dist/runtime/templates/licenses/notices and exactly one package/bin.
- [x] Implement `smoke:tarball` with isolated install plus init/setup each platform and multi-platform.
- [x] Implement `measure:init` with documented fixture/repetitions and <5-second worst-run gate.
- [x] Implement `measure:footprint` using `UPSTREAM_BASELINE.md` definition and >=50% reduction gate.
- [x] Implement `scan:release` for secrets, machine paths, required TODOs, forbidden branding/surfaces, second package/workspace, dead packaged imports and duplicate hooks.
- [x] `test:acceptance` orchestrates all non-packaging suites and doctor fixtures; every script propagates non-zero exit on gate failure.

**Phase 4 gate:** [x] all acceptance commands and smoke/safety/performance/footprint checks green with fresh output (2026-08-07: 87 tests, tarball smoke for Kiro/Antigravity/Codex/all, 471 ms worst init, 98.99% footprint reduction).

## 9A. Phase 5 — Review remediation and contract hardening

The 2026-08-10 repository review found lifecycle and persisted-state gaps that were not exercised by the historical Phase 4 suite. The authoritative finding list, implementation order, regression strategy, and completion evidence are maintained in [`REVIEW_REFACTOR_PLAN.md`](./REVIEW_REFACTOR_PLAN.md).

- [x] P0 data safety and workflow correctness complete.
- [x] P1 lifecycle and diagnostic completeness complete.
- [x] P2 harness quality, performance, and dependency hygiene complete.
- [x] Fresh section 11 acceptance sequence and dependency audits pass (runtime audit clean; one documented Low development-only exception remains time-bounded).

Historical Phase 1–4 checkmarks record their original checkpoints; they do not supersede Phase 5 regression evidence.

## 9B. Phase 6 — User-global platform integrations (planned)

Yêu cầu ngày 2026-08-11 thay đổi `setup` từ project-local sang user-global cho Kiro, Antigravity và Codex. Đây là active architecture refactor; các checkmark Phase 1–5 chỉ mô tả behavior cũ đã hoàn tất và không được dùng để claim Phase 6 complete.

Trong phạm vi Phase 6, constraint cũ “không global config mutation” và các frozen project-local platform paths bị supersede bởi explicit, Harnix-owned user-global customization. Các cấm đoán về global runtime, memory, credential, MCP, permission mutation, telemetry và silent network vẫn giữ nguyên.

Kế hoạch, official path/schema snapshot, migration policy, work breakdown và acceptance gate nằm tại [`GLOBAL_SETUP_REFACTOR_PLAN.md`](GLOBAL_SETUP_REFACTOR_PLAN.md).

- [ ] G0 cập nhật toàn bộ normative documentation contracts theo thiết kế đã duyệt.
- [ ] G1–G3 thêm isolated-home tests, safe user paths, global ownership/locking/rollback.
- [ ] G4–G6 chuyển Kiro, Antigravity Desktop/CLI và Codex sang official current user-global surfaces.
- [ ] G7–G8 tách lifecycle global/project và cleanup project-local integration cũ một cách explicit.
- [ ] G9–G10 cập nhật templates/release scripts rồi chạy full automated và disposable-profile acceptance.

## 10. Required test inventory

| Suite | Required coverage |
|---|---|
| Unit | detection, config migrations, context rank/budget, hashes/manifest, atomic writes, journal, learning, doctor checks |
| CLI integration | all seven commands, idempotence, modified/deleted files, corrupt/future schemas |
| Migration | discovery, dry-run, copy/transform, preservation, conflict, rollback, cleanup |
| Fixtures | .NET/ABP, NestJS, Python, Java/Spring, Go, React, Vue, multilingual monorepo |
| Platform | Kiro/Antigravity/Codex snapshots and schema, relevant rules, no machine path |
| Codex | AGENTS preservation, skills metadata, config merge, hooks Windows/Linux, duplicate prevention, user-owned files |
| Workflow eval | routing, research, debug, TDD exception, reviews, verification, budget, finish/continue, promotion |
| Safety | traversal/symlink, hook injection, secrets, purge, data preservation, duplicates |
| Packaging | one package/bin, tarball contents, installed smoke tests, forbidden surface scan |

All filesystem tests use isolated temporary repositories. Tests must not mutate global user configuration or call real install/network operations.

## 11. Acceptance command sequence

Task 1.1 phải tạo đúng các package scripts dưới đây. Chạy từ dependency state sạch; mỗi script ghi command, duration, exit code và summary. Scripts dùng isolated temp fixtures, không global mutation và không real network ngoài explicit `pnpm install`/upgrade integration mock boundary.

```text
pnpm install --frozen-lockfile
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm test:acceptance
pnpm pack:check
pnpm smoke:tarball
pnpm measure:init
pnpm measure:footprint
pnpm scan:release
```

Script contracts:

- `test:acceptance`: chạy unit/integration/migration/platform/workflow/safety suites, gồm clean và seeded unsafe `doctor --json` fixtures.
- `pack:check`: xóa/recreate project-local `.artifacts/` safely, chạy `pnpm pack --pack-destination .artifacts`, assert đúng một `@tamtiger/harnix` tarball và kiểm contents/license/runtime/templates.
- `smoke:tarball`: cài tarball đó vào isolated fixtures rồi chạy `init`, setup từng Kiro/Antigravity/Codex và tổ hợp ba platform; Antigravity dùng injected runner hoặc local `agy` khi available.
- `measure:init`: chạy documented non-migration fixture nhiều lần, report median/worst wall-clock và fail nếu worst >=5 giây.
- `measure:footprint`: đo files/bytes theo `UPSTREAM_BASELINE.md`, report numerator/denominator và fail nếu reduction <50%.
- `scan:release`: scan tarball + generated fixtures cho forbidden branding/surfaces, secrets, absolute machine paths, required TODO, second package/workspace, dead packaged imports và duplicate hooks.

Failure dừng gate, kích hoạt systematic debugging và rerun focused rồi full command. Previous/partial output không phải completion evidence.
## 12. Risk register

| Risk | Likelihood/impact | Mitigation/gate |
|---|---|---|
| Clean repository has no committed documentation baseline | Medium/Medium | Preserve user-owned docs; report untracked state; never auto-commit; implementation changes remain attributable by path/checkpoint |
| PRD old requirements leak into implementation | High/High | PRD normalization before scaffold; trace matrix review |
| Codex/Kiro/Antigravity surface drift | Medium/High | Official docs validation at implementation; schema snapshots; doctor drift checks |
| Hash manifest causes data loss | Medium/High | Conservative ownership, atomic writes, corrupt/symlink tests |
| Legacy migration partial state | Medium/High | Staging/verify/atomic activation/rollback/source preservation |
| Rule/skill bloat | High/Medium | Context budget, concise packs, footprint threshold, routing evals |
| License omission | Low/High | NOTICE/license scan and source metadata |
| Interactive CLI makes CI flaky | Medium/Medium | Inject prompts; `--yes`, `--user`, `--languages`; isolated integration tests |
| Upgrade tests call real network/install | Low/High | Inject dependencies; fail test on unexpected process/network |

## 13. Definition of done

Harnix chỉ hoàn thành khi:

- Mọi PRD criterion và adopted capability trace tới code/test.
- Tất cả command gates pass từ fresh output.
- Tarball cài và smoke được trên temp repositories.
- Doctor clean fixture pass và seeded unsafe/duplicate/legacy fixtures được phát hiện.
- Init <5 giây và footprint giảm ít nhất 50% theo định nghĩa đã khóa.
- Không có second package/workspace, unsupported adapters, dead imports, secrets, accidental absolute paths, required TODO hoặc duplicate hooks.
- Trellis chỉ còn trong attribution/research/migration compatibility/license/history.
- Remaining limitation/deviation được ghi rõ, không được che bằng claim suy luận.

Sau documentation checkpoint này, implementation tiếp tục Phase 1–4 theo thứ tự; không chờ phê duyệt giữa phase trừ khi user yêu cầu checkpoint mới hoặc xuất hiện blocker về credential/authority/product decision không thể suy ra an toàn.
