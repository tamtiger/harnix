# PRD — Triển khai bốn capability harness đã chọn

## 1. Outcome

Triển khai trong một Full task bốn capability có quyết định `adapt` từ research ngày 2026-08-18: context selection-basis freshness, deterministic ready trace audit, untrusted learning-promotion guard và dependency-aware repo-map ranking. Kết quả phải tăng độ tin cậy của resume/planning/learning/discovery mà không mở rộng Harnix khỏi một package, một CLI và đúng Kiro, Antigravity, Codex.

## 2. Vấn đề hiện tại

1. `context.json` chỉ hash entry đã chọn, nên candidate inventory, selector signals hoặc ranker đổi vẫn có thể báo `current`.
2. TaskRecord v2 chứng minh criterion↔check nhưng chưa chứng minh PRD↔plan slice↔check/path; ready gate vẫn dựa một phần vào self-review prose.
3. `promotionProposal()` render nguyên `candidate.statement`, nên persistent learning có thể mang prompt-injection-like text vào bước review.
4. Repo-map lưu `importTargets` nhưng ranking chủ yếu lexical; dependency neighbor hoặc test liên quan có thể đứng sau lexical noise.

## 3. Phạm vi giao hàng

Bốn CAP được triển khai tuần tự trong cùng active TaskRecord, mỗi CAP có RED→GREEN slices và focused gate riêng. Task chỉ chuyển `verifying` sau khi cả bốn focused gates green; chỉ hoàn tất sau compliance review, quality/security review, patch version/changelog và exact acceptance mục 11.

### AC `selection-snapshot-contract`

Khi context được persist qua hidden workflow transport, Harnix validate `ContextManifestV1`, ghi `context.json` cùng task-owned `context-selection.json` v1 bằng safe atomic replacement và bind:

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

`selectionInputHash` là SHA-256 lowercase của canonical JSON chứa normalized task relevant paths/specs, config language/technology/package/context/runtime facets, selected guide paths, selector version và inventory fingerprint. `selectionResultHash` bind sorted selected `{path,reason,priority,pinned,states}` cùng omitted `{path,reason}`, không bind `contentHash`. Sidecar không chứa task prose, raw source, secret hoặc absolute path.

### AC `selection-drift-inspection`

`ContextDrift` luôn có `selectionChanges`, sorted unique:

```ts
type ContextSelectionChangeKind =
  | "inventory-changed"
  | "inventory-unavailable"
  | "selection-signals-changed"
  | "selector-version-changed";
```

Hidden inspect/continue recompute input digest từ active TaskRecord/config/guide catalog, đọc selector version và validated repo-map cache, nhưng không recompute context selection, scan repository, refresh hoặc write. Content drift tiếp tục dùng relative path/kind hiện có. Content hoặc selection drift làm `stale`; snapshot hợp lệ và sạch làm `current`.

### AC `legacy-safety-compatibility`

`ContextManifestV1` không sidecar vẫn đọc được. Nếu content sạch thì tổng state là `not-recorded`; nếu content stale thì vẫn là `stale`. Corrupt/future/task mismatch/result mismatch bị reject; missing/invalid current repo-map cho sidecar đã tồn tại tạo `inventory-unavailable`. Global hook không đọc sidecar hoặc repo-map, giữ true no-op ngoài initialized project và bounded read trong project.

### AC `ready-trace-contract`

Full task artifacts dùng trace grammar v1 ngoài fenced code blocks:

```text
prd.md:  ### AC `<criterion-id>`
plan.md: - [ ] `<slice-id>` — <description>
         ### Slice `<slice-id>`
         Criteria: `<criterion-id>`, ...
         Checks: `<check-id>`, ...
         Paths: `<safe-posix-path-or-glob>`, ...
```

Criterion/check ID dùng TaskRecord ID regex; slice ID dùng `^[A-Z][A-Z0-9-]*$`. Token arrays code-unit sorted, unique, non-empty. Mỗi non-waived criterion và required check có ít nhất một slice; checklist/detail map một-một; path dùng safe POSIX rules. Parser bỏ code fence, giới hạn artifact 1 MiB, line 4096 chars, 256 slices và 1024 references; không execute Markdown.

Hidden `harnix workflow --audit-ready` trả:

```ts
type ReadyTraceDiagnosticCode =
  | "artifact-too-large" | "line-too-long" | "placeholder"
  | "criterion-missing" | "criterion-duplicate"
  | "slice-checklist-missing" | "slice-duplicate" | "slice-detail-missing"
  | "slice-metadata-missing" | "unknown-criterion" | "unknown-check"
  | "unsafe-path" | "orphan-criterion" | "orphan-required-check";

interface ReadyTraceDiagnosticV1 {
  code: ReadyTraceDiagnosticCode;
  artifact: "prd.md" | "plan.md" | "task.json";
  id?: string;
  line?: number;
  message: string;
}

interface ReadyTraceReportV1 {
  generator: "harnix";
  schemaVersion: 1;
  taskId: string;
  status: "pass" | "fail";
  diagnostics: ReadyTraceDiagnosticV1[];
}
```

Diagnostics sort `artifact → code → id → line` và không chứa artifact body hoặc absolute path.

### AC `ready-trace-enforcement`

`assertReadyRequirements()` dùng cùng auditor cho mọi Full transition/re-transition vào `ready` sau khi capability được cài. Lite không nhận thêm ceremony. Task đã `completed` hoặc `ready/ready` trước activation không bị retroactive read/rewrite; unfinished legacy chỉ nhận obligation khi explicit `replan` rồi quay lại `ready`. Active task hiện tại là bootstrap task: nó được ready trước auditor tồn tại nhưng artifacts được viết theo grammar v1 để tự-host sau implementation.

### AC `learning-review-boundary`

Không đổi persisted `LearningCandidateV1` hoặc eligibility formula. Thêm:

```ts
type LearningRiskKind =
  | "command-like"
  | "credential-like"
  | "instruction-override"
  | "url-like";

interface LearningReviewMetadataV1 {
  statementHash: string;
  sourceTaskIds: string[];
  evidenceIds: string[];
  findings: LearningRiskKind[];
}

interface PromotionProposalV2 {
  eligible: boolean;
  specPath: string;
  content: string;
  review: LearningReviewMetadataV1;
}
```

Statement được render duy nhất dưới `Statement-JSON: <JSON.stringify(statement)>` trong fixed untrusted boundary, kèm safe candidate ID, exact UTF-8 SHA-256, sorted provenance/evidence/findings. Newline, Markdown fence hoặc giả boundary trong statement không thể thoát serialized field. Proposal không auto-promote hoặc auto-edit spec.

### AC `learning-doctor-safety`

Analyzer bounded 64 KiB, chỉ classify `instruction-override`, `command-like`, `url-like`, `credential-like`; không fetch URL, execute command hoặc log matched value. Doctor aggregate tối đa một finding mỗi journal file:

```text
code: persistent-learning-suspicious
severity: warning
path: workspace/<developer>/journal/<date>.jsonl
message: Suspicious persistent learning data categories: <sorted categories>; review as untrusted data.
fixable: false
```

`doctor --fix` không sửa/xóa journal. Unicode, multiline và command-as-documentation vẫn round-trip dưới JSON string; suspicious classification chỉ là review signal, không tuyên bố malware hoặc block user approval.

### AC `repo-map-graph-ranking`

Giữ `RepoMapV1`; graph chỉ dựng in-memory từ validated records. Chỉ resolve relative imports bắt đầu `./|../` sang indexed safe paths theo exact, extensionless, rồi `<target>/index.*`; URL/absolute/bare package/traversal ngoài root bị bỏ. Target có hơn 4 match bị coi ambiguous và bỏ.

Hard caps: 10.000 nodes, 100.000 resolved edges, 50 lexical seeds, 200 expanded candidates, depth 2. Iteration/code-unit order xác định. Ranker v2 mở rộng seeds bằng inbound/outbound neighbors và cộng bonus:

| Signal | Bonus | Reason |
|---|---:|---|
| direct imported dependency | `+120` | `dependency-neighbor` |
| direct importer | `+100` | `referenced-by` |
| depth-2 relation | `+40` | reason theo hướng đầu tiên |
| inbound degree | `min(50, 5 × inboundCount)` | `dependency-centrality` |

Graph bonus cộng sau lexical/task/package/profile score; reasons unique/sorted; final sort vẫn `score desc → path asc`.

### AC `repo-map-ranking-compatibility`

Thêm internal/injected `RepoMapRankerVersion = 1 | 2`, default 2; CLI không expose flag. Version 1 giữ golden lexical behavior để rollback. `repo-map --query` vẫn cache-only, JSON shape cũ, limit `1..20`, không filesystem/network/source read. Ranking eval so v1/v2 trên fixture có distractor: v2 không giảm existing queries và cải thiện ít nhất hai dependency-specific queries. Không persist graph hoặc đổi cache schema.

### AC `program-docs-release`

Trong cùng change phải cập nhật `docs/HARNIX_PRD.md`, `docs/HARNIX_WORKFLOW.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/HARNESS_RESEARCH.md`, `docs/UPSTREAM_MAPPING.md`, canonical skills/templates, package patch version thực tế và `CHANGELOG.md`. Chỉ bump patch một lần sau khi cả bốn CAP và focused gates green, trước completion persistence. Giữ một package/bin và đúng ba platform.

### AC `verification`

Mỗi behavior slice có RED evidence trước GREEN. Sau bốn CAP: compliance review trước quality/security review; chạy focused checks, broader quality gate và nguyên acceptance sequence mục 11 bằng fresh output. Fake homes/temp repos không chạm real user profile.

### AC `docs-release`

Historical waived obligation:

Criterion cũ yêu cầu ba CAP còn lại được defer thành task riêng. Yêu cầu người dùng mới đã mở rộng active task sang cả bốn CAP, nên criterion này được waiver có lý do trong TaskRecord và được thay bằng `program-docs-release`; không sửa hoặc xóa historical obligation.

## 4. Ngoài phạm vi

- Living spec/spec delta, no-spec marker, platform network probe, context condenser, auto-memory, hosted runtime, mandatory subagents, workflow presets.
- ContextManifest/LearningCandidate/RepoMap persisted schema v2; package/workspace/service/platform mới.
- Embedding/vector DB, watcher/daemon, telemetry, runtime network, raw-source cache.
- Auto rewrite artifact/spec, auto promotion, Doctor journal fix, hook-time repo-map I/O, Git automation.

## 5. Compatibility và rollback

- CAP-01: ngừng emit/xóa sidecar mới; manifest v1 trở về `not-recorded`.
- CAP-02: gỡ enforcement/action; grammar mới vẫn là Markdown hợp lệ, historical state không migrate.
- CAP-03: revert renderer/analyzer/finding; journal/spec chưa bị rewrite.
- CAP-04: default internal ranker về v1; cache/public CLI không đổi.
- Partial CAP failure không cho task sang `verifying`; giữ completed slices green và quay `debugging|replan` theo workflow.

## 6. Quyết định vật chất

- Người dùng đã quyết định gộp bốn CAP vào active Full task; implementation vẫn chia checkpoint/gate độc lập.
- Sidecar thay ContextManifest v2; ready audit deterministic thay LLM judge; learning guard là serialization/category warning thay semantic antivirus; graph dùng cache v1 thay AST/embedding.
- Không còn quyết định sản phẩm hoặc schema chưa khóa trước implementation.
