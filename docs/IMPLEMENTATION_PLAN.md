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
- User-modified project files and user-global Harnix fragments thắng packaged defaults.
- Không telemetry, daemon, hosted service, silent network, default MCP, global runtime/memory, credential, permission or trust mutation. Phase 6 permits only explicit Harnix-owned user-global platform customization described in `GLOBAL_SETUP_REFACTOR_PLAN.md`.
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
│   ├── commands/            # init, setup, update, upgrade, uninstall, mem, status, tasks, resume, context-report, checks, audit, doctor, repo-map
│   ├── configurators/       # kiro.ts, antigravity.ts, codex.ts only
│   ├── templates/           # harnix + platform content
│   ├── catalog/             # pure language/technology/guide metadata + validation
│   ├── guides/              # common/language/technology Markdown sources
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

Filesystem, clock, process runner, version lookup, prompt dependencies and user-home/root resolvers must be injectable so integration tests never call network/install, interactive terminals or a real user profile.

## 4. Frozen state and schema contracts

Các contract project-data trong mục này là normative cho implementation hiện tại. Phase 6 supersedes former platform setup paths and the Doctor v1 shape with the global contracts in `GLOBAL_SETUP_REFACTOR_PLAN.md`; TaskRecord v2 ở mục 4.3 supersedes schema v1 cho task mới nhưng giữ exact legacy reader. Any field, enum, path or transition change still requires matching PRD/workflow, migration and test updates in the same change.

### 4.1 `.harnix/config.yaml` v1 compatibility and v2 write schema

```ts
type LegacyStackId =
  | "csharp-dotnet-abp"
  | "typescript-nestjs"
  | "php"
  | "python"
  | "java-spring"
  | "go"
  | "react-web"
  | "vue";

type LanguageId = "csharp" | "typescript" | "javascript" | "php" | "python" | "java" | "go";
type TechnologyId = "dotnet" | "abp" | "nestjs" | "spring" | "react-web" | "vue" | "codeigniter";

type PlatformId = "kiro" | "antigravity" | "codex";

interface PackageConfigV2 {
  path: string;              // normalized repo-relative POSIX path; "." for root
  languages: LanguageId[];   // unique, lexicographically sorted
  technologies: TechnologyId[]; // unique, lexicographically sorted
  [compatibleUnknown: string]: unknown;
}

interface HarnixConfigV1 {
  generator: "harnix";
  schemaVersion: 1;
  developer: string;         // journal namespace ID matching ^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$
  languages: LegacyStackId[];
  packages: Array<{ path: string; languages: LegacyStackId[]; [compatibleUnknown: string]: unknown }>;
  platforms: PlatformId[];   // v1 parse compatibility only; deprecated and ignored for desired global setup
  context: {
    maxCharacters: number;   // positive integer, default 24000
    tokenApproximation: number; // positive number, default 4 chars/token
  };
  runtime: {
    research: "conditional";
    fullContext: boolean;
  };
  [compatibleUnknown: string]: unknown;
}

interface HarnixConfigV2 {
  generator: "harnix";
  schemaVersion: 2;
  developer: string;
  languages: LanguageId[];
  technologies: TechnologyId[];
  packages: PackageConfigV2[];
  platforms: PlatformId[];   // deprecated compatibility field; ignored by global setup
  context: { maxCharacters: number; tokenApproximation: number; [compatibleUnknown: string]: unknown };
  runtime: { research: "conditional"; fullContext: boolean; [compatibleUnknown: string]: unknown };
  [compatibleUnknown: string]: unknown;
}
```

New init and every config write use v2 only. Reads classify input as valid v1, valid v2, corrupt or future without writing. Explicit `update` and `doctor --fix` migrate v1 atomically and permission-preservingly; read-only commands and `init` on an existing project never migrate. Migration maps `csharp-dotnet-abp -> csharp + dotnet,abp`, `typescript-nestjs -> typescript + nestjs`, `java-spring -> java + spring`, plain `php|python|go` to the matching language, and historical `react-web|vue` to technology only. It never rescans the repository.

YAML serialization is deterministic with LF golden fixtures. Compatible unknown user keys round-trip at top level and inside package/context/runtime objects; core logic ignores them and known keys cannot be shadowed. Duplicate/unsorted arrays, absolute/package-escape paths, unsafe developer IDs, invalid enums, corrupt YAML and future schema fail before write.

### 4.1A Stack, detector and guide catalogs

The packaged pure catalog owns stable language/technology IDs, labels, technology kind (`framework|runtime|platform|library|database|tool|infrastructure|domain`), declarative detector expressions, guide references and provenance. Initial technology kinds are: `dotnet:runtime`, `abp|nestjs|spring|vue|codeigniter:framework`, `react-web:library`. Catalog code must not import filesystem collectors, commands, terminal UI or platform adapters.

Detector predicates are the discriminated union `file(glob)`, `dependency(ecosystem,name)` and `content(glob,contains)`. Expressions require a positive `allOf` or `anyOf`; both combine conjunctively and `noneOf` excludes. Globs are safe repository-relative POSIX patterns supporting literals, `*` and `**` only; content matching is bounded literal matching, never regex or code execution. Validation rejects duplicate IDs/predicates, invalid enum/confidence/provenance, unsafe paths, missing/self/cyclic `implies`, `guideIds`, `extends` or `supersedes` references, conflicting supersedence and duplicate guide content paths.

Detection returns deterministic bounded matches with facet, technology kind or `language`, confidence `confirmed|probable|weak`, repository-relative evidence `{kind,path,detail}` and source `catalog`. Language is established independently from framework/runtime: NestJS does not imply TypeScript, Spring/build metadata does not imply Java, `.sln`/`global.json` does not imply C#, and React/Vue do not imply JavaScript or TypeScript. Config auto-selection uses confirmed/probable technology matches; weak evidence remains reviewable.

Guide descriptors declare ID/title/description/category, language/technology/path/topic applicability, activation `always|path|task`, priority, `contentPath`, composition/supersedence and provenance. Packaged Markdown is imported at build time; source tests prove a one-to-one descriptor/content mapping. Selection order is common, language, then increasingly specific technology/domain, with priority and ID as deterministic tie-breakers. Only selected content is materialized below `.harnix/spec/guides/`.

### 4.2 Project managed manifest

File: `.harnix/.template-hashes.json`.

```ts
interface ManagedEntryV1 {
  path: string;             // POSIX-normalized repo-relative, unique
  sourceId: string;         // stable packaged template/rule/skill identifier
  scope: "project";
  generatedHash: string;    // lowercase SHA-256 of normalized content
  generatorVersion: string;
}

interface ManagedManifestV1 {
  generator: "harnix";
  schemaVersion: 1;
  entries: ManagedEntryV1[]; // sorted by path
}
```

Manifest replacement là atomic. This project manifest owns only `.harnix/**` templates and never global integration output; former platform entries are legacy inventory only. Ownership state được suy ra từ desired template, stored entry và disk hash; không persist transient state. Project update result có `metadataUpdated: string[]` cho entry chỉ đổi manifest metadata; path đó vẫn thuộc `preserved` và không được đưa vào content `updated`. Không track tasks/journals. Reject duplicate/absolute/traversal keys, external symlinks, invalid hash và corrupt/future manifest. Legacy hash namespace không được tin; migration re-baseline từ disk/template evidence.

### 4.2A Global managed manifest

Phase 6 adds `GlobalManagedManifestV1` exactly as specified in `GLOBAL_SETUP_REFACTOR_PLAN.md` §5. It is a separate sidecar per verified Kiro, Antigravity Desktop, Antigravity CLI or Codex root, with only root-relative POSIX paths. Each entry has a stable `sourceId`, kind `file|managed-block|json-member`, generated hash/version and a required non-overlapping selector for fragments. Shared JSON array members are identified by stable `memberId` plus exact structural signature, never an array index. Corrupt/future data fails before write; a multi-platform transaction preflights all targets, locks in stable order, writes its manifest last and rolls back only when the disk still equals the output Harnix wrote. Mỗi canonical `managed.lock` path là directory chứa một unique UUID owner-token file với record schema v1. `mkdir(..., { recursive: false })` tạo candidate; candidate chỉ được trả ownership sau khi token là sole entry và exact bytes vẫn khớp. Stale/release cleanup đọc lại rồi unlink đúng observed token, sau đó gọi non-recursive `rmdir`; token identity đã đổi hoặc replacement directory có token khác thì preserve và retry/bounded timeout. Empty hoặc malformed Harnix token chỉ được reclaim sau stale threshold; live/identity-unknown owner và legacy single-file lock luôn fail closed.

### 4.3 Task record and workflow state

File: `.harnix/tasks/<task-id>/task.json`; `<task-id>` là lowercase `YYYYMMDD-HHMMSS-<kebab-slug>`, trong đó slug có một hoặc nhiều token alphanumeric không rỗng, phân tách bằng đúng một dấu `-`; collision chỉ append deterministic numeric suffix. Uppercase, empty segment, leading/trailing hyphen, traversal và path separator đều không hợp lệ. Active task được lưu bằng repo-relative task ID trong `.harnix/tasks/.active`, atomic replace; terminal `completed|cancelled` task xóa pointer chỉ khi pointer vẫn trỏ đúng task. Pointer rỗng là idle; pointer non-empty trỏ tới task file bị thiếu hoặc invalid phải throw typed invalid-state error và giữ nguyên pointer, không được project thành idle.

Mọi transition vào `ready` yêu cầu acceptance criteria không rỗng, có ít nhất một validation check `required: true`, và với Full thì `prd.md`/`plan.md` phải được safe-resolve rồi đọc lại là không rỗng. Sau lần persist đầu tiên, acceptance criterion ID/text và required validation-check ID/description/command/scope/required là monotonic obligations; ở v2, `criterionIds` và `inputs` cũng bất biến. Payload sau không được xoá, đổi tên, demote hoặc mutate in-place. Clarification thêm obligation mới; criterion cũ chỉ được đổi status/evidence hoặc explicit waiver có reason.

```ts
type TaskMode = "lite" | "full";
type TaskStatus = "planning" | "ready" | "in_progress" | "verifying" | "blocked" | "completed" | "cancelled";
type WorkflowCheckpoint =
  | "triage" | "planning" | "ready" | "implementing"
  | "debugging" | "replan" | "verifying" | "finishing" | "cancelling";
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
  cancellation?: { reason: string; authorizedBy: "user" };
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cancelledAt?: string;
}

interface ValidationCheckV2 {
  id: string;
  description: string;
  command?: string;
  scope: "focused" | "full";
  required: boolean;
  criterionIds: string[];
  inputs: string[];
}

interface EvidenceRecordV2 extends EvidenceRecordV1 {
  inputDigest?: string;
}

interface TaskRecordV2 extends Omit<TaskRecordV1, "schemaVersion" | "validationPlan" | "evidence"> {
  schemaVersion: 2;
  validationPlan: ValidationCheckV2[];
  evidence: EvidenceRecordV2[];
}
```

Task mới chỉ được tạo bằng schema v2; workflow transport reject new v1 nhưng direct reader vẫn hỗ trợ exact historical v1. Cả hai version dùng exact recursive allowlist cho TaskRecord, acceptance criterion, validation check, evidence, blocker và cancellation; unknown top-level hoặc nested key bị reject. `criterionIds` phải unique/valid; required check phải map ít nhất một criterion và mọi non-waived criterion phải được ít nhất một required check bao phủ. `inputs` là danh sách sorted unique không rỗng, luôn chứa `@task-contract`; các entry còn lại là safe project-relative POSIX file/glob. Check có từ khóa `repository|source|file|build|test|lint|typecheck|package|runtime|code|compile|smoke|acceptance` trong ID/description/command phải có ít nhất một repository input. Absolute path, backslash, empty segment, `.`/`..`, traversal và symlink/junction escape bị reject; mỗi pattern phải match ít nhất một file. Mode là monotonic: Lite có thể promote sang Full với required artifacts/gates, nhưng persisted Full không được downgrade về Lite ở bất kỳ unfinished transition nào.

Snapshot chuẩn gồm canonical task contract (task ID/mode, criterion ID/text, toàn bộ validation definition), Full `prd.md`/`plan.md`, và sorted `{path,sha256}` của repository input. `inputDigest` là SHA-256 lowercase của canonical JSON `{schemaVersion:2,taskId,checkId,taskContractHash,entries}`. Hidden `harnix workflow --snapshot --check <id>` chỉ đọc state/input. Required passing evidence v2 phải có digest 64-hex; save recompute và chỉ chấp nhận digest hiện tại, rồi ghi immutable task-owned `.harnix/tasks/<id>/verification-inputs.json` keyed by evidence ID. Sidecar chỉ chứa ID, relative path và hash, không chứa source body, secret, absolute path, prompt, environment hoặc command output.

Completion v2 yêu cầu latest fresh pass của từng required check, criterion-linked evidence nằm trong giao của `criterion.evidenceIds` và check có `criterionIds` chứa criterion đó, đồng thời finish recompute snapshot khớp sidecar. Drift fail closed với check ID cùng safe relative `changed`/`missing` paths; unreadable/unsafe/empty match cũng fail. Timestamp freshness không thay thế input freshness. Unscoped evidence và pre-migration evidence không digest không chứng minh completion v2.

Schema v1 vẫn được đọc đúng semantics cũ. Terminal `completed|cancelled` v1 được byte-preserve. Unfinished v1 chỉ migrate rõ ràng sang v2 khi cả previous/candidate ở checkpoint `replan`, status không đổi, acceptance criteria và prior evidence giữ nguyên, rồi append đúng evidence ID `task-schema-v1-to-v2`; downgrade bị reject. Legacy pass trước migration có thể được bảo toàn mà không có digest nhưng không hỗ trợ completion v2. `update` và Doctor không rewrite; Doctor chỉ emit `legacy-task-schema` (`warning` cho unfinished, `info` cho terminal `completed|cancelled`).

Legal success transitions: `planning -> ready -> in_progress -> verifying -> completed`; any unfinished state may enter `blocked` and resume only to its recorded prior status, hoặc chuyển terminal `cancelled/cancelling` qua hidden `workflow --cancel` khi có explicit user authority. `debugging`, `replan`, `finishing` và `cancelling` là checkpoints. `cancelled` cần non-empty concise `cancellation.reason`, `authorizedBy: "user"`, valid `cancelledAt`, không blocker/completedAt; nó giữ criteria/evidence nguyên trạng, không resume và không thỏa completion. `workflow --cancel` persist terminal task → append journal kind `cancellation` với deterministic ID → clear matching active pointer; retry từ `cancelled/cancelling` dùng original `cancelledAt` journal date và không duplicate. Illegal jump, malformed/future record hoặc acceptance/evidence reference lỗi fail closed. Full task bắt buộc `prd.md` + `plan.md`; `design.md`, `research/`, `context.json` và `verification-inputs.json` conditional. Lite giữ toàn bộ minimum trace trong `task.json`. Validation invariants chung: `met` criterion cần ít nhất một existing evidence ID; `waived` cần non-empty `waiverReason`; command evidence cần integer `exitCode`; `blocked` cần blocker + matching `resumeStatus`; `completed` cần `completedAt`, không blocker và mọi required criterion `met|waived`.

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

Deterministic base score là pin `1000`, explicit task/acceptance reference `500`, active package/path `250`, applicable language-or-technology profile `100` (một bounded stack bonus dù cả hai facet match), cross-project guide `25`; applicable signals cộng dồn, sau đó sort pinned → score/priority descending → normalized path ascending. Context loader không execute included text, không follow external symlink và luôn disclose omitted entries. Repository paths reject C0/C1 control characters cùng U+2028/U+2029. Platform payload serializes omitted paths with `JSON.stringify`; opening marker, excerpts, disclosure and closing marker share one hard character budget, and disclosure remains entirely inside the fixed untrusted repository boundary even when no excerpt fits. Explicit full-context bypasses budget only, không bypass path safety/dedupe/source listing.

Hidden inspect/continue luôn project `contextDrift: {state,changes,selectionChanges}` với state `not-recorded|current|stale`, sorted relative path changes `changed|missing|unreadable|unverified` và sorted selection-basis changes theo §4.4A. Không có manifest/hash là `not-recorded`; mixed hashed/unhashed là `stale` với entry thiếu hash `unverified`. Chỉ đọc path đã liệt kê và safe-resolve dưới root. Continue gặp `stale` phải persist cùng status với checkpoint `replan` trước khi dùng lại context và route Brainstorm để reselect; không tự sửa source hay manifest. `not-recorded` trên legacy state chỉ được disclose, không tự ép migration/replan.

### 4.4A Context selection freshness sidecar v1

Explicit hidden context persistence atomically writes a task-owned `.harnix/tasks/<task-id>/context-selection.json` beside `context.json`:

```ts
interface ContextSelectionSnapshotV1 {
  generator: "harnix";
  schemaVersion: 1;
  taskId: string;
  selectorVersion: 1;
  inventoryFingerprint: string;
  selectionInputHash: string;
  selectionResultHash: string;
}
```

`selectionInputHash` canonicalizes task relevant paths/specs, known config profile/package/context/runtime facets, selected guide paths, selector version and validated repo-map inventory fingerprint. `selectionResultHash` canonicalizes sorted included/omitted selection metadata and deliberately excludes `contentHash`. Inspect returns `contextDrift.selectionChanges` sorted from `inventory-changed|inventory-unavailable|selection-signals-changed|selector-version-changed`; any content or selection change is `stale`. Manifest v1 without sidecar remains readable and is `not-recorded` when content is clean. Corrupt/future/task/result binding fails closed; missing/invalid current cache produces `inventory-unavailable` without scan, refresh, query or write.

### 4.5 Journal and learning

Journal path: `.harnix/workspace/<developer>/journal/YYYY-MM-DD.jsonl`; namespace directory được tạo lazy khi ghi entry đầu tiên. Mỗi UTF-8 JSON object nằm trên một line, append bằng locked/atomic strategy phù hợp platform. Malformed lines được report và skip, không làm mất valid entries.

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
  kind: "checkpoint" | "completion" | "cancellation" | "learning" | "note";
  summary: string;
  evidenceIds: string[];
  learning?: LearningCandidateV1;
}
```

Candidate normalization dedupe `sourceTaskIds`/`evidenceIds`; `occurrences` bằng số source task độc lập. Deterministic confidence là `min(1, 0.4 + 0.2*min(distinctTasks,2) + 0.1*min(distinctEvidence,2))`. Không có explicit approval thì chỉ eligible để đề xuất khi distinct tasks >=2, distinct evidence >=2 và confidence >=0.8; write vào spec vẫn cần finish/review action rõ và luôn reviewable. Không hidden/global promotion.

Public `harnix mem --learning` adds only a kind filter before the existing query/limit merge and preserves the default `{entries,malformed}` JSON contract. Hidden `workflow --learn` reads exact bounded stdin `{ "candidate": { "id", "statement", "sourceTaskIds", "evidenceIds" } }` only from active `verifying/finishing`; caller cannot set developer/path/time/status/occurrences/confidence. It reuses completion input freshness, requires the current task plus completed source tasks and at least one referenced evidence per source, enforces the frozen eligibility formula and 64 KiB limit, then appends deterministic ID `<current-task>-<candidate>-learning`. Identical retry across journal dates returns `created:false`; conflicting reuse fails. Output is `{entry,eligible:true,created,findings}` with sorted redacted finding categories. TaskRecord, active pointer, historical journal lines and specs remain unchanged.

### 4.5A Untrusted learning review boundary

`LearningCandidateV1` persisted shape và eligibility formula không đổi. `promotionProposal()` trả `PromotionProposalV2` với `review: {statementHash,sourceTaskIds,evidenceIds,findings}`; findings thuộc `command-like|credential-like|instruction-override|url-like`, sorted và không giữ matched values. Statement tối đa 64 KiB cho proposal, được render duy nhất dưới `Statement-JSON: <JSON.stringify(statement)>` trong fixed Harnix untrusted-learning boundary. Doctor union categories trên mỗi journal file thành một `persistent-learning-suspicious` warning, logical path only, `fixable:false`; `doctor --fix` không sửa journal hoặc spec.

### 4.5B Full ready trace v1

Full `prd.md` dùng level-three `AC` headings với criterion ID backtick-wrapped; Full `plan.md` dùng checklist và level-three `Slice` blocks với slice ID backtick-wrapped cùng backtick lists `Criteria:`, `Checks:` và `Paths:`. Parser bỏ fenced code, cap 1 MiB/artifact, 4096 chars/line, 256 slices và 1024 references; slice IDs match `^[A-Z][A-Z0-9-]*$`. Hidden `workflow --audit-ready` trả stable `ReadyTraceReportV1` JSON, không echo body/absolute path. Auditor bắt missing/duplicate/orphan/unknown/unsafe/placeholder trace và là gate cho mọi Full transition/re-transition vào `ready`; Lite và historical completed/ready records không bị rewrite.

### 4.5C Dependency-aware repo-map ranker

RepoMapV1/cache/public query JSON không đổi. Internal ranker default v2 resolves only relative `./|../` imports by exact, extensionless, then `index.*`; external, absolute, root traversal and targets with more than four matches are omitted. In-memory graph caps 10,000 nodes/100,000 edges; query uses 50 lexical seeds, at most 200 candidates and depth 2. Bonuses are direct dependency `+120`, direct importer `+100`, depth two `+40`, and inbound centrality `min(50,5*count)`; reasons are stable and final tie-break remains score descending then code-unit path ascending. Internal injected ranker v1 retains lexical rollback behavior; graph is never persisted or used by global hooks.

### 4.5D Public task status v1

`harnix status` is the ninth public command. It resolves the nearest initialized ancestor without Git/process/network discovery, validates config and active task state, and emits exactly one JSON document without a `--json` option or any write:

```ts
interface HarnixStatusResultV1 {
  generator: "harnix";
  schemaVersion: 1;
  activeTask: null | {
    id: string;
    mode: "lite" | "full";
    status: TaskStatus;
    checkpoint: WorkflowCheckpoint;
    progress: {
      acceptance: { met: number; waived: number; pending: number; total: number };
      requiredChecks: { passed: number; failed: number; stale: number; pending: number; total: number };
    };
    context: { state: "not-recorded" | "current" | "stale"; changeCount: number; selectionChangeCount: number };
  };
  nextAction: { code: string; message: string };
  attention: Array<{ code: string; count: number }>;
}
```

Task prose, criterion/check descriptions, validation commands, blocker text, prompts, secrets and absolute paths are never projected. Latest required-check evidence is chosen by `recordedAt`, then persisted append order as the deterministic compatibility tie-break shared with completion/input freshness. Missing/latest skipped is `pending`; latest fail is `failed`; pass older than one hour or in the future is `stale`. A v2 pass is `passed` only when its `inputDigest`, immutable sidecar snapshot and freshly recomputed input digest all match; any read/match error becomes `stale`. V1 remains age-only.

`nextAction` precedence is blocked → stale context → planning → ready → in-progress → verifying-not-green → verifying-green → terminal pointer recovery → no active. Stable codes are `resolve-blocker`, `replan-context`, `complete-planning`, `begin-implementation`, `continue-implementation`, `run-verification`, `finish-task`, `finalize-task`, and `no-active-task`. Attention order is `context-stale`, `required-check-failed`, `required-check-stale`; pending checks do not create pre-verification noise. Representative active output is below 2 KiB.

### 4.5E External harness feature provenance v1

`docs/HARNESS_FEATURE_PROVENANCE.json` is the canonical machine-checkable registry for maintained external-derived capabilities. Exact top-level fields are `generator`, `schemaVersion`, `reviewedAt`, `features`; feature/source/implementation objects also use exact allowlists. Feature IDs and source repositories are sorted unique. Each feature records `adopt|adapt`, lifecycle, immutable 40-hex source ref, source date, license, evidence URLs, Harnix adaptation delta, and sorted unique concrete code/test/docs paths. Every mapped path must normalize safely and exist. `test/workflow/provenance.test.ts` pins the current backfill set and fails on missing/unknown fields, mutable refs, duplicate/unsorted values, unsafe/glob/missing targets, or empty evidence.

Behavioral research alone does not claim copied code. `NOTICE` changes only when reused code/content creates an attribution obligation; clean-room references still remain visible in the registry. Any future harness-derived feature must update registry, canonical research/mapping and the expected feature-ID regression in the same task before completion.

### 4.5F Public resilient task index v1

`harnix tasks [--limit <1..100>] [--status <TaskStatus>]` is the tenth public command and defaults to 20 results. It reads at most 1,000 safe task-directory candidates, always reserves scan budget for the active candidate, exact-schema validates each record independently, and treats malformed/unreadable records as isolated invalid entries. A valid active task that matches the filter is pinned first; remaining results sort by `updatedAt` descending then code-unit ID descending. Status filtering occurs before the result limit and never bypasses the filter for active state.

`TaskIndexResultV1` has exact top-level fields `generator`, `schemaVersion`, `scope`, `status`, `filter`, `summary`, `activeTaskId`, `attention`, `tasks`. `scope` is `project`; `status` is `ready|partial`, where only invalid records or an unavailable active pointer make the result partial. Scan/result truncation is bounded normal behavior exposed through summary flags. Each item contains only `id`, `mode`, `status`, `checkpoint`, `active`, `updatedAt`; title/goal, prompt, artifact/journal body, criterion/check/blocker prose, evidence summary, validation command, secret and absolute path are omitted. Record files are capped at 1 MiB, active pointer at 1 KiB. The command never writes, changes the pointer, refreshes cache, runs a process, or uses network.

### 4.5G Public repo-map impact v1

`harnix repo-map --impact <path> [--depth <1..3>] [--limit <1..20>]` is mutually exclusive with `--query` and hidden `--refresh`; `--depth` is impact-only. The target must be one exact normalized non-root repository-relative POSIX path. It reads RepoMapV1 only, returns direct outgoing dependencies plus unique reverse dependents from cycle-safe BFS up to depth (default 2), sorts dependents by distance then code-unit path, and applies limit independently to both directions (default 20). Stable status is `ready|missing|invalid|not-found`; every non-ready result preserves the same JSON shape with empty lists and false truncation flags. The action never scans source, reads snippets, refreshes/writes cache, infers dynamic dependencies, changes cache schema, or runs in a global hook.

### 4.5H Public exact task resume v1

`harnix resume <task-id> [--dry-run]` is the eleventh public command. It accepts one canonical task ID only; candidate record reads are capped at 1 MiB and active pointer reads at 1 KiB. Candidate directory/record identity, exact TaskRecord schema and unfinished status are validated before any mutation. An absent/empty pointer yields `would-resume` in dry-run or permission-preserving atomic replacement followed by `resumed`; an already matching valid unfinished pointer yields `already-active` without a write. A malformed/dangling/terminal pointer, another active task, or a missing/malformed/oversized/terminal candidate fails closed without overwrite.

`TaskResumeResultV1` has exact top-level fields `generator`, `schemaVersion`, `scope`, `dryRun`, `outcome`, `task`, `nextAction`. `scope` is `project`; `outcome` is `would-resume|resumed|already-active`; task contains only `id`, `mode`, `status`, `checkpoint`; next action is the fixed `inspect-active-task` instruction. The command changes only `.harnix/tasks/.active`: it never edits a TaskRecord, evidence, sidecar or artifact, performs a transition, restores a transcript/model session/Git state, or calls network. Sequential state is atomic and fail-closed; no cross-process compare-and-swap guarantee is claimed.

### 4.5I Public effective-context explanation v1

`harnix context-report --platform <kiro|antigravity|codex> [--limit <1..50>]` is the twelfth public command and defaults to 20 details per category. It shares one effective-context builder with hidden `harnix context`: persisted context entries plus applicable guides when a manifest exists, otherwise task `relevantPaths` plus applicable guides. Bounded mode is identical to hook selection: Codex 2,500 characters; Kiro/Antigravity `min(config.context.maxCharacters, 8000)`; maximum 64 inspected entries.

`ContextReportResultV1` has exact top-level fields `generator`, `schemaVersion`, `scope`, `platform`, `filter`, `activeTask`; no active task is clean success with `activeTask:null`. Active output contains only task `id`, `budget`, bounded `drift`, `summary`, `selected`, `omitted`. Selected items contain `path`, sorted derived `reasonCodes`, `priority`, `pinned`; allowed reason codes are `applicable-guide|persisted-selection|pinned|task-reference`. Omitted items retain only relative path and `budget|duplicate|missing|unsafe`. Raw reason/states, content, hash, task prose, hook event, secret and absolute path are forbidden. Limit applies independently to selected, omitted and drift changes; the entire serialized result is capped at 262,144 UTF-8 bytes by dropping deterministic whole tail items and setting count/truncation fields. The command never writes or calls network, and hidden hook payload/activation behavior remains regression-locked.

### 4.5J Public required-check freshness explanation v1

`harnix checks [--limit <1..50>]` is the thirteenth public command and defaults to 20 required checks. `ChecksReportResultV1` has exact top-level fields `generator`, `schemaVersion`, `scope`, `filter`, `activeTask`; no active task is clean success. Active output contains task `id|mode|status|checkpoint`, aggregate summary and code-unit-sorted checks. Each item contains only `id`, `state`, sorted `reasonCodes`, `changeSummary`, and at most 20 relative `changed|missing` paths. Limit truncates whole check records; the 262,144-byte result cap first drops detail paths, then whole tail checks, while preserving full counts and truncation flags.

The classifier is shared by checks and status/audit projections. Latest evidence uses timestamp then append-order tie behavior. `no-evidence|latest-skipped` is pending, `latest-failed` is failed, and invalid/future/expired pass is stale. A v1 fresh pass is passed. A v2 fresh pass requires matching immutable sidecar/evidence digest and current input digest; safe categorical causes are `snapshot-missing|snapshot-invalid|snapshot-mismatch|task-contract-changed|inputs-changed|inputs-missing|inputs-unavailable`. No check description/command, evidence ID/summary/time/hash/input pattern, criterion/task prose, secret or absolute path is emitted. The command never executes validation, writes state/evidence/sidecars, or calls network.

### 4.5K Public task audit v1

`harnix audit` is the fourteenth public command. No active task is a clean success with `{generator,schemaVersion,activeTask:null}`. Active output contains exactly `id`, `mode`, `status`, `checkpoint`, `readiness`, `completion`. Full readiness reuses the exact bounded ready-trace auditor while stripping diagnostic message prose; each diagnostic contains only `code`, `artifact`, optional `id`, optional `line`. Artifact read failure becomes `unavailable` plus `artifact-unavailable`; Lite readiness is `not-applicable`.

Completion separates criteria `{met,waived,pending,total,pendingIds}` from required checks `{passed,failed,stale,pending,total,failedIds,staleIds,pendingIds}`. A criterion counts as met only when persisted met and supported by fresh evidence under completion semantics; waived remains waived and every other state is pending. Required checks reuse the exact latest-evidence, one-hour age, v2 immutable sidecar and freshly recomputed input-digest semantics used by status/finish. ID lists sort code-unit. Completion passes only with non-empty criteria/checks, every criterion completion-ready and every required check passed. Audit never runs a command, edits artifacts/state, advances workflow, calls network, or emits private prose/commands/secrets/absolute paths; an audit pass is visibility, not verification evidence.

### 4.6 Doctor JSON v2

```ts
interface DoctorFinding {
  code: string;
  severity: "error" | "warning" | "info";
  path?: string; // logical path only; never an absolute home path
  message: string;
  fixable: boolean;
}

interface DoctorReportV2 {
  generator: "harnix";
  schemaVersion: 2;
  ok: boolean;
  project: {
    status: "ready" | "not-initialized" | "invalid";
    findings: DoctorFinding[];
  };
  globalIntegrations: Array<{
    platform: "kiro" | "antigravity" | "codex";
    status:
      | "not-installed"
      | "installed"
      | "active"
      | "installed-pending-trust"
      | "binary-unavailable"
      | "shadowed"
      | "precedence-unknown"
      | "unsupported-version"
      | "drifted"
      | "invalid";
    findings: DoctorFinding[];
  }>;
  summary: { errors: number; warnings: number; fixed: number };
}
```

Consumer expecting v1 receives an explicit schema mismatch, never a misleading flat object. Finding order is deterministic by severity/code/path and secrets are redacted. The regular CLI does not invoke platform-version probes or infer activation/precedence from installed files: `active`, `shadowed` and `unsupported-version` are valid only when authoritative external evidence is supplied at the lifecycle boundary; otherwise the report remains conservative (`installed`, `installed-pending-trust`, `binary-unavailable` or `precedence-unknown`). Exit `0` means global state was read safely with no warning/error; `project:not-initialized` outside a project is info. Exit `1` is an actionable warning (including pending trust, binary unavailable, precedence/version drift). Exit `2` is invalid usage or unsafe/corrupt/future project/global state. `--fix` repairs only safe project issues; `--fix --global` reconciles only safe missing/unchanged global entries and never changes trust, permissions, features or user-modified fragments.

### 4.7 Internal platform-hook protocol

`harnix context --platform <kiro|antigravity|codex>` is the only packaged fast-path hook command, not public API and does not increase the fourteen-command public contract. Legacy `harnix internal context ...` is not an alias and must fall through to regular CLI rejection. Release performance measurement invokes the exact canonical installed command. The hidden command:

1. accepts bounded optional hook-event JSON from stdin, validates `cwd` and bounded `workspacePaths[]`, and falls back safely to process cwd;
2. resolves the **nearest** initialized project ancestor/root from cwd or workspace roots using safe realpath containment, including non-Git workspaces, deduplicated symlink-equivalent roots; it must not require the current workspace directory itself to contain `.harnix`;
3. loads bounded ranked context without network, write, prompt/transcript/credential logging or execution of project content;
4. exits `0` with empty output in a non-Harnix repository; malformed optional input fails open for the hosting agent using the platform-specific output below (a malformed Antigravity event is an empty no-op). A known initialized project with corrupt/inaccessible state must fail closed for project data and emit only a concise redacted platform-specific warning without blocking the host agent;
5. emits no absolute home path, obeys stdin/stdout/time/workspace-root bounds and always discloses context truncation.

Global platform handlers use fixed, non-concatenated commands:

- **Kiro:** `~/.kiro/hooks/harnix-context.json` JSON-v1 `UserPromptSubmit` command `harnix context --platform kiro`, timeout 5; stdout is UTF-8 plain developer context.
- **Antigravity:** each global plugin has a `PreInvocation` command `harnix context --platform antigravity`, timeout 5. It returns `{ "injectSteps": [{ "ephemeralMessage": "..." }] }` only on the initial invocation in a known initialized project. A non-Harnix workspace or malformed optional event exits `0` with empty stdout; `{ "injectSteps": [] }` is emitted only after initialized-project resolution succeeds but the invocation is later or no context applies.
- **Codex:** `$CODEX_HOME/config.toml` has one managed inline nested `UserPromptSubmit` command `harnix context --platform codex`, timeout 5 and `additionalContextLimit = 2500`. Keeping the hook in the inline TOML source avoids Codex's mixed `hooks.json`/`config.toml` startup warning; unchanged legacy JSON is migrated conservatively. Output is valid nested `hookSpecificOutput` or plain developer context according to the current schema; Windows uses a constant launcher form only after shim-resolution smoke evidence.

Repository excerpts in every platform payload use the same explicit untrusted-data opening/closing boundary. Boundary and omission disclosure count toward the character cap; trimming preserves the closing marker and never expands the selected path set. Fixtures cover malicious README/comment/generated data, duplicate/oversized input, fake secret/traversal and nested-root noise, plus non-Harnix no-op, corrupt/malformed optional input, Unicode/spaces, nested Git/non-Git discovery, Antigravity zero/one/multi-root selection and ambiguity, bounded output, Codex Windows resolution, and cold-path performance (median <300ms, p95 <750ms, no sample >1s).

### 4.8 Common CLI result semantics

Mọi public command dùng stderr cho actionable error/warning và stdout cho exactly one JSON document. Exit `0` là success/clean intentional no-op/dry-run; exit `1` là operation hoặc diagnostic hoàn tất nhưng có actionable finding/conflict/failure; exit `2` là invalid usage/config/schema/root hoặc deterministic internal failure. Public command throw trước normal result dùng exact envelope dưới đây trên stdout và cùng redacted `message` trên stderr; hidden `context`/`workflow` không emit envelope để giữ hook/workflow protocol:

```ts
interface PublicCliErrorV1 {
  generator: "harnix";
  schemaVersion: 1;
  ok: false;
  error: {
    exitCode: 1 | 2;
    message: string;
  };
}
```

Không in secret values, stack trace mặc định hoặc machine-specific absolute path trong generated output; global output uses logical paths such as `~/.kiro/...` and `$CODEX_HOME/...`. Project `update` returns sorted `created`, content `updated`, metadata-only `metadataUpdated`, `preserved`, `deleted` và `obsolete`; một path metadata-only không được claim là content update. `setup` returns the Phase 6 `GlobalSetupResult` with scope `user`, per-platform readiness and created/updated/unchanged/preserved/warnings. Readiness khác `installed` hoặc warning không rỗng được ghi actionable lên stderr và trả exit `1`; clean `installed` trả `0`. `upgrade` always returns `{ installed: string, available: string|null, command: string[], applied: boolean }`; absent injected lookup means offline `available:null`, and only explicit `--apply` invokes the fixed npm executable/argument array. `init` is always non-interactive and emits one `InitProjectResult` with project status, developer, sorted languages/technologies, bounded `detection.matches`, and sorted created/updated/unchanged/preserved/warnings arrays. Existing projects return empty detection matches because init does not rescan; new/dry-run projects report pre-override evidence and warnings identify overridden facets. `status`, `tasks`, `context-report`, `checks`, `audit` and repo-map impact return the bounded read-only projections in §§4.5D/4.5F–G/4.5I–K; `resume` uses the pointer-only mutation in §4.5H. No-active/missing-cache cases follow their stable result contracts. `--yes` is not part of the public init syntax; a hidden no-op compatibility alias may remain for v0.5 callers.
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

Phase 1–5 task checkmarks below are historical delivery evidence. Their former project-local platform output is legacy inventory, not a current normative setup requirement; Phase 6 contracts in section 9B and `GLOBAL_SETUP_REFACTOR_PLAN.md` supersede it.

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
- [x] Phase 4 extension: add clean/seeded Doctor JSON fixtures to `test:acceptance`, then have smoke/release scripts consume the checked tarball and isolated fixtures.
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
- [x] Test ignored `node_modules/vendor/bin/obj/dist/build` trees and agent/tooling namespaces (`.agents`, `.kiro`, `.gemini`, `.trellis`, `.understand-anything`).
- [x] Detect package manager and available verification scripts without executing them.
- [x] Return deterministic sorted languages/packages/commands.

### Task 1.4: Config schema and init

**Create:** `src/core/config/**`, `src/commands/init.ts`, Harnix base templates.

- [x] RED config tests implement exact 4.1 types/invariants, valid/corrupt/future schemas and compatible unknown-key round-trip preservation.
- [x] RED CLI tests for zero-option non-interactive init, optional `--user`/`--languages` overrides, per-path status output and idempotence.
- [x] Init creates only required files plus a small root `AGENTS.md` bootstrap for AI agents; task/journal directories are lazy, and no duplicate `.developer`, runtime scripts or platform hook/settings are created.
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

- [x] RED ranking tests lock 4.4 additive scores, tie-break, pin, task reference, active package/path, bounded language-or-technology profile bonus and guide priority.
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

**Create:** generated workflow template từ canonical doc; source thật `src/skills/harnix-*/SKILL.md` cho `harnix-brainstorm`, `harnix-implement`, `harnix-check`, `harnix-finish-work`, `harnix-continue`.

- [x] Generated `.harnix/workflow.md` giữ đúng state/transition/gate semantics và được managed-until-edited.
- [x] Eval Bypass không tạo task; Lite/Full tạo đúng artifact contract.
- [x] Eval lite/full/ambiguous/forced routing.
- [x] Full output contains acceptance criteria, material-unknown research decision and decision-complete plan.
- [x] Explicit implementation request proceeds after ready gate without duplicate approval; plan-only request stops at `ready`.
- [x] Implement loads scoped context and records checkpoints.
- [x] Check enforces compliance stage before quality/security stage.
- [x] Finish requires fresh verification, journals evidence and never commits.
- [x] Continue routes from persisted status/checkpoint, loads minimum relevant state and fails closed on corrupt/future task state.
- [x] Generated workflow and every skill state incoming status, persisted transition/checkpoint, and exit/handoff; planning is written before product edits and plan-only work remains at persisted `ready`.
- [x] Project profile values are discovery seeds; current repository evidence and bounded task relevance control context selection.

### Task 3.2: Research/debug skills

**Create:** `harnix-research`, `harnix-debug`.

- [x] Eval research activates only for defined material unknowns.
- [x] Research findings retain source/date/task attribution, conclusion, and remaining uncertainty.
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

### Phase 3 hardening: canonical skill sources (2026-08-13)

- [x] RED chứng minh source `src/skills/harnix-*/SKILL.md` chưa tồn tại và prose bị duplicate trong `workflow.ts`.
- [x] Bảy source canonical adapt behavior đã chọn từ frozen Trellis/ECC/Superpowers, có trigger frontmatter, semantic `metadata.version` đồng bộ package release, activation guard, incoming/persist/exit và provenance.
- [x] Raw Markdown được nhúng vào bundle; Kiro/Antigravity/Codex render byte-identical content và không còn renderer skill guard riêng.
- [x] Focused source/workflow/platform tests green.
- [x] Forward behavior eval, typecheck, lint, build, platform/setup suites, pack/tarball/release gates và fake-home update đều green trước khi đóng hardening slice.

## 9. Phase 4 — Lifecycle, migration, doctor và release polish

### Task 4.1: Update

- [x] Materialize desired template set from config/platform/language.
- [x] Apply managed ownership state machine.
- [x] Report user-deleted files and require explicit restore path.
- [x] Never touch tasks/journals/unrelated files.

### Task 4.2: Upgrade

- [x] Report installed and always-present `available: string|null`; default offline CLI uses `null`, while an authorized host can inject a lookup.
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

## 9B. Phase 6 — User-global platform integrations (complete in the authorized scope)

Yêu cầu ngày 2026-08-11 thay đổi `setup` từ project-local sang user-global cho Kiro, Antigravity và Codex. G0–G9 và phần automated của G10 đã hoàn tất; các checkmark Phase 1–5 chỉ mô tả behavior cũ đã hoàn tất. Dated manual evidence ngày 2026-08-13 được giữ làm lịch sử. Revalidation disposable ngày 2026-08-18 chứng minh `agy` implicit routing/no-op sau rule migration nhưng print mode vẫn load 0 hook file; Kiro/Codex fake profiles thiếu login và Codex pending trust. Current activation chỉ được claim theo fresh surface evidence, không suy từ historical run hoặc file presence.

Trong phạm vi Phase 6, constraint cũ “không global config mutation” và các frozen project-local platform paths bị supersede bởi explicit, Harnix-owned user-global customization. Các cấm đoán về global runtime, memory, credential, MCP, permission mutation, telemetry và silent network vẫn giữ nguyên.

Kế hoạch, official path/schema snapshot, migration policy, work breakdown và acceptance gate nằm tại [`GLOBAL_SETUP_REFACTOR_PLAN.md`](GLOBAL_SETUP_REFACTOR_PLAN.md).

- [x] G0 cập nhật toàn bộ normative documentation contracts theo thiết kế đã duyệt.
- [x] G1–G3 thêm isolated-home tests, safe user paths, global ownership/locking/rollback.
- [x] G4–G6 chuyển Kiro, Antigravity Desktop/CLI và Codex sang official current user-global surfaces.
- [x] G7–G8 tách lifecycle global/project và cleanup project-local integration cũ một cách explicit; legacy cleanup chỉ có thể xóa standalone path đúng source/path do manifest v1 chứng minh, còn root/shared file chỉ inventory.
- [x] G9 cập nhật templates/AGENTS guard, release scripts và chạy full automated acceptance với fake-home/project fixtures.
- [x] G10 historical manual disposable-profile/tool-session smoke đã hoàn tất trong authorized scope; revalidation 2026-08-18 giữ current status conservative per surface và không dùng login/trust bypass.
- [x] Revalidation 2026-08-18: global Kiro steering, Antigravity rule và Codex AGENTS block bắt buộc implicit routing cho ordinary prompt không nhắc Harnix; Antigravity chuyển sang always-on `rules/AGENTS.md` không frontmatter, với ownership migration xóa file cũ không đổi và preserve file cũ đã sửa.

## 9C. Workflow freshness hardening — C1–C3

Nghiên cứu ngày 2026-08-14 tại task `20260814-081624-harness-capability-research` bổ sung guardrail resume/completion mà không mở rộng platform hoặc runtime service.

- [x] C1: deterministic `contextDrift` projection và stale-context `replan` routing.
- [x] C2: TaskRecord v2 coverage graph, criterion/check evidence intersection, exact v1 compatibility và explicit replan migration.
- [x] C3: canonical verification inputs, hidden snapshot, save-time race check, immutable sidecar và finish-time recomputation.
- [x] C1–C3 focused unit/workflow/migration/Doctor fixtures green.
- [x] Đồng bộ release metadata và chạy fresh exact acceptance mục 11 trước khi đóng hardening.

## 9D. Repository review/refactor continuation — F1–F9

Yêu cầu ngày 2026-08-14 xác nhận skill content version chỉ là một slice nhỏ và đợt review/refactor toàn repository phải tiếp tục. Audit matrix, root cause, disposition và focused evidence nằm trong active Harnix task `20260814-142615-repository-review-refactor-continuation`.

- [x] F1–F2: harden managed JSON/marker preflight, prototype-safe JSON tree và idempotent stable selector.
- [x] F3: mở rộng public redaction/release scanning cho machine paths và unquoted high-signal secrets.
- [x] F4–F5: sửa repo-map containment, deterministic code-unit ordering và positive-integer limits.
- [x] F6: dùng strict existence probe bảo toàn mọi existing node và propagate non-`ENOENT` failure.
- [x] F7–F9: hợp nhất bounded stdin/safe glob và tách pure marker/JSON khỏi transaction hotspot.
- [x] Fresh required checks, exact acceptance mục 11 và dependency audits pass trên current tree ngày 2026-08-14; global lifecycle/smoke chỉ dùng fake/disposable homes.

## 9E. Adopted harness capabilities — CAP-01–CAP-04

Research task `20260818-140304-harness-capability-landscape` selected four bounded capabilities for the Full implementation task `20260818-214545-context-selection-freshness`.

- [x] CAP-01: context selection-basis sidecar, drift projection, legacy/cache/hook compatibility.
- [x] CAP-02: bounded deterministic ready-trace audit, hidden action and Full readiness enforcement.
- [x] CAP-03: untrusted learning serialization/hash/risk metadata and redacted no-fix Doctor finding.
- [x] CAP-04: safe bounded dependency graph, default ranker v2, v1 rollback and ranking eval.
- [x] Cross-CAP canonical docs/skills/templates, patch release, two-stage review and exact acceptance.

## 9F. Harness UX observability, navigation, audit and provenance — HX-STATUS-01/HX-NEXT-01/HX-TASKS-01/HX-IMPACT-01/HX-AUDIT-01/HX-PROVENANCE-01

Research task `20260826-132459-harness-ux-research-improvements` revalidated the three frozen upstreams, screened 12 current harness repositories and deep-dived 8 using primary mechanism sources plus real-usage signals. Frozen ownership refs remain unchanged; dated current observations live in `UPSTREAM_BASELINE.md` §2.1 and task research.

- [x] HX-STATUS-01: public bounded read-only `harnix status`, nearest initialized ancestor, no-active success, aggregate acceptance/check/context projection và private-field omissions.
- [x] HX-NEXT-01: deterministic next-action precedence, ordered attention và TaskRecord v1 age/v2 digest freshness classification.
- [x] HX-TASKS-01: resilient bounded `harnix tasks`, independent record validation, active pin, exact filter/order/partial semantics và private-body omission.
- [x] HX-IMPACT-01: cache-only exact-path `repo-map --impact`, bounded cycle-safe dependency/dependent traversal, deterministic direction limits và stable failure states.
- [x] HX-AUDIT-01: public read-only `harnix audit`, exact Full ready-trace plus completion-freshness projection, stable blocker IDs và no-execution/no-mutation semantics.
- [x] HX-PROVENANCE-01: canonical `HARNESS_FEATURE_PROVENANCE.json` backfill với exact-schema/source/ref/date/license/evidence/adaptation/path regression.
- Completion gate: đồng bộ generated workflow và patch release, rồi chạy compliance-before-quality review cùng fresh exact acceptance mục 11.

## 9G. Task recovery và explainability — HX-RESUME-01/HX-CONTEXT-REPORT-01/HX-CHECKS-01

Research task `20260826-154348-harness-feature-expansion` revalidated current primary mechanisms và usage signals, tái hiện ba local gaps rồi chỉ chọn adaptation vượt fit/privacy/license hard gate. Transcript/session store, Git rewind, daemon notification, fuzzy task-body indexing và automatic model-context ownership tiếp tục nằm ngoài scope.

- [x] HX-RESUME-01: exact unfinished-task `harnix resume`, dry-run, bounded validation, collision fail-close và pointer-only atomic mutation.
- [x] HX-CONTEXT-REPORT-01: shared effective-context builder cùng metadata-only `harnix context-report`, platform cap, drift/truncation và hidden-hook parity regressions.
- [x] HX-CHECKS-01: structured required-check classifier cùng read-only `harnix checks`, path-level freshness causes, output bounds/privacy và status/audit parity.
- [x] HX-PROVENANCE-02: registry IDs `context-selection-explanation`, `task-resume-recovery`, `verification-freshness-explanation` map immutable refs/licenses tới concrete code/test/docs paths.
- Completion gate: README/canonical docs/templates, patch release, compliance-before-quality review và fresh exact acceptance mục 11.

## 10. Required test inventory

| Suite | Required coverage |
|---|---|
| Unit | detection, config/task migrations, task status/index/resume/audit, shared effective context rank/budget/content+selection drift, required-check classifier/input snapshots, ready trace, repo-map graph/ranker/impact, project/global manifests, permission-preserving atomic writes, home/path containment, locks, rollback, journal/learning safety, Doctor v2 |
| CLI integration | all fourteen commands, bounded/no-write/private status/tasks/context-report/checks/audit plus pointer-only resume from nested initialized paths, v1 age and v2 digest freshness, collision/malformed/privacy/truncation fixtures, project/global scope, setup outside a project, init repo-map creation, cache-only repo-map query/impact, idempotence, modified/deleted files, corrupt/future project/global schemas |
| Migration | discovery, dry-run, copy/transform, preservation, conflict, rollback, cleanup |
| Fixtures | independent C#/.NET/ABP, TypeScript/NestJS, PHP/CodeIgniter, Python, Java/Spring, Go, React web/Native exclusion, Vue, multilingual/multi-technology monorepo |
| Platform | Kiro user-global JSON hook + implicit steering, Antigravity Desktop/CLI `rules/AGENTS.md` snapshots/path migration and multi-root protocol, Codex user-global schema + implicit AGENTS block, no machine path |
| Codex | global AGENTS preservation, skills metadata, nested hooks Windows/Linux, `CODEX_HOME`/override/trust/duplicate coverage, user-owned files |
| Workflow eval | routing, research, debug, TDD exception, reviews, criterion-linked/digest verification, budget, finish/continue, context replan, promotion, exact external-feature provenance/path registry |
| Safety | traversal/symlink/junction, hook no-op/injection, secrets, global uninstall confirmation, data preservation, collisions, locks and duplicate/legacy hooks |
| Packaging | one package/bin, tarball contents, fake-home + project smoke tests, forbidden project-local setup surface scan |

All filesystem tests use isolated temporary repositories **and injected disposable user homes**. Tests must not mutate real user configuration or call real install/network operations.

## 11. Acceptance command sequence

Task 1.1 phải tạo đúng các package scripts dưới đây. Chạy từ dependency state sạch; mỗi script ghi command, duration, exit code và summary. Scripts use isolated temporary repositories plus fake homes, never a real profile, and no real network outside explicit `pnpm install`/upgrade integration mock boundary.

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
git diff --check
```

Script contracts:

- `test:acceptance`: chạy unit/integration/migration/platform/workflow/safety suites, gồm clean và seeded unsafe Doctor JSON fixtures.
- `pack:check`: xóa/recreate project-local `.artifacts/` safely, chạy `pnpm pack --pack-destination .artifacts`, assert đúng một `@tamtiger/harnix` tarball và kiểm contents/license/runtime/templates.
- `smoke:tarball`: cài tarball đó vào two independent temporary roots: fake user home for global setup and one-or-more project fixtures for `init`/context; smoke từng Kiro/Antigravity/Codex và tổ hợp ba platform without a real profile.
- `measure:init`: chạy documented non-migration fixture nhiều lần, report median/worst wall-clock và fail nếu worst >=5 giây.
- `measure:footprint`: đo files/bytes theo `UPSTREAM_BASELINE.md`, report numerator/denominator và fail nếu reduction <50%.
- `scan:release`: scan tarball + generated fixtures cho forbidden branding/surfaces, stale project-local setup output, secrets, absolute machine paths, required TODO, second package/workspace, dead packaged imports và duplicate hooks.

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
| Init CLI interaction makes CI flaky | Medium/Medium | Init has no prompt; optional `--user`/`--languages` give deterministic overrides; isolated integration tests |
| Upgrade tests call real network/install | Low/High | Inject dependencies; fail test on unexpected process/network |

## 13. Definition of done

Harnix chỉ hoàn thành khi:

- Mọi PRD criterion và adopted capability trace tới code/test.
- Tất cả command gates pass từ fresh output.
- Tarball cài và smoke được trên temp repositories.
- Setup runs from outside a Harnix project and writes only official user-global surfaces with dry-run/status, safe ownership, rollback and scoped uninstall.
- Doctor JSON v2 clean fixture pass; seeded unsafe/duplicate/legacy/global fixtures are detected and Codex is never claimed active before trust evidence.
- Tarball smoke uses a fake home plus project fixtures; disposable Windows profile smoke verifies discovery/activation/trust/uninstall after explicit authorization.
- Init <5 giây và footprint giảm ít nhất 50% theo định nghĩa đã khóa.
- Không có second package/workspace, unsupported adapters, dead imports, secrets, accidental absolute paths, required TODO hoặc duplicate hooks.
- Trellis chỉ còn trong attribution/research/migration compatibility/license/history.
- Remaining limitation/deviation được ghi rõ, không được che bằng claim suy luận.

Sau documentation checkpoint này, implementation tiếp tục Phase 1–4 theo thứ tự; không chờ phê duyệt giữa phase trừ khi user yêu cầu checkpoint mới hoặc xuất hiện blocker về credential/authority/product decision không thể suy ra an toàn.

## 14. Repository map v1

Use `globby@^14.1.0` for Node-18-compatible, ignore-aware local inventory and `minisearch@^7.2.0` only for in-memory lexical candidates. Persist a validated, atomically replaced `.harnix/cache/repo-map-v1.json` with sorted relative paths, content hashes, bounded identifiers/headings/import targets and no raw source or absolute path. Fresh init and hidden internal refresh write; public `repo-map --query <text> [--limit <count>]` and exact-path `repo-map --impact <path> [--depth <1..3>] [--limit <1..20>]` are read-only and JSON-default. Project Doctor inventories missing/stale/invalid cache and safe `--fix` rebuilds it. Required fixtures cover non-Git/Git ignores, secrets, binaries, limits, symlink/junction escape, deterministic cache, query ranking, impact traversal/cycles/failure states, hook no-write, Node 18 ESM, footprint and release scans.
