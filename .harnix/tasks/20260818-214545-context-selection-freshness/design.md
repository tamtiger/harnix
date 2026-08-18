# Design — Bốn capability harness

## 1. Kiến trúc tổng

```text
commands/internal composition
  ├─ workflow save/inspect/audit-ready
  ├─ doctor learning diagnostics
  └─ repo-map query
           |
           v
core pure/bounded modules
  ├─ context/context.ts + context/selection-freshness.ts
  ├─ tasks/ready-trace.ts
  ├─ journal/learning-safety.ts + promotion.ts
  └─ repo-map/graph.ts + search.ts
           |
           v
utils: paths, hashing, ordering, atomic write
```

Commands/configurators compose dependencies; core không import Commander/Inquirer/platform templates. Tất cả filesystem/clock/process/network behavior có injection point khi test cần deterministic control. Platform hook giữ đường đi riêng qua bounded `buildContext()` và không gọi selection freshness, ready audit, learning analyzer hoặc repo-map graph.

## 2. CAP-01 data flow

```text
explicit context persist
  TaskRecord + config + guide selection + selectorVersion
  validated repo-map inventoryFingerprint
  validated ContextManifestV1
                |
                v
canonical input/result SHA-256
                |
     context.json + context-selection.json

workflow inspect/continue
  load manifest + optional sidecar
  hash selected content paths
  recompute current signals/cache/version
                |
                v
  changes[] + selectionChanges[] -> state
```

### Types và ownership

`ContextSelectionSnapshotV1` nằm tại `.harnix/tasks/<id>/context-selection.json`, user-owned cùng task, không thuộc managed template manifest. `TaskArtifacts.context` nhận typed `ContextManifestV1`; command layer đọc config/cache và tạo snapshot, validate mọi dependency trước write. `context.json` và sidecar dùng safe task-directory resolution và atomic replacement.

Canonical serializer dùng fixed key insertion order, code-unit sorted unique arrays và lowercase SHA-256. `selectionResultHash` bỏ `contentHash` để content drift vẫn có path-level diagnostic riêng.

### Drift precedence

| Manifest | Sidecar | Content changes | Selection changes | State |
|---|---|---|---|---|
| missing/no hashes | any | none | none | `not-recorded` |
| valid v1 | missing | none | none | `not-recorded` |
| valid v1 | missing | có | none | `stale` |
| valid v1 | valid | none | none | `current` |
| valid v1 | valid | có | any | `stale` |
| valid v1 | valid | none | có | `stale` |

Corrupt/future/task/result binding mismatch throw logical validation error không lộ absolute path. Missing/invalid current repo-map khi sidecar tồn tại không throw source detail; trả `inventory-unavailable` và `stale`.

## 3. CAP-02 ready trace

### Parser

`src/core/tasks/ready-trace.ts` nhận `{task, prd, plan}` strings và bounded limits, trả `ReadyTraceReportV1`. Parser line-based state machine:

1. Reject artifact >1 MiB hoặc line >4096.
2. Track fenced blocks mở bởi line bắt đầu ba backtick/tilde; mọi grammar/placeholder bên trong bị bỏ qua.
3. Parse PRD headings `### AC `<id>``.
4. Parse plan unchecked checklist, `### Slice `<id>`` và ba metadata lines liền trong detail block.
5. Normalize/sort references; compare với TaskRecord criteria/checks/path safety.
6. Emit all structural diagnostics rồi sort stable; không early-return trừ size/line hard bound.

Placeholder scan ngoài fence dùng token-boundary case-insensitive cho `TBD`, `TODO`, `PLACEHOLDER`, `???`, `<fill-me>`. Nó chỉ báo vị trí line, không echo line content.

### Enforcement

`auditReadyTrace()` là pure/read-only. `inspectWorkflow` không tự audit. Hidden `workflow --audit-ready` đọc active task/artifacts và in JSON. `assertReadyRequirements()` chạy audit sau task schema validation và non-empty artifact check, trước write/transition. Report fail làm ready transition reject với stable summary; detailed diagnostics lấy qua hidden action.

Bootstrap rule: active encompassing task đã `ready` trước capability; implementation không tự đưa nó về ready lần nữa. Mọi Full task mới hoặc explicit replan sau release phải pass. Lite path không đọc PRD/plan.

## 4. CAP-03 learning guard

### Analyzer

`analyzeLearningStatement(statement)` reject/flag oversized >64 KiB bằng bounded category outcome, compute exact UTF-8 hash và deterministic regex categories. Regex không capture/log credential value. Analyzer pure, không network/filesystem/process.

### Renderer

`promotionProposal()` centralize qua `renderUntrustedLearningCandidate()`. Statement không được interpolate raw; chỉ `JSON.stringify(statement)` sau label `Statement-JSON`. Fixed prefix/suffix nằm ngoài serialized value. Candidate ID/provenance arrays phải pass existing safe ID semantics; output arrays/categories code-unit sorted.

```text
<<< HARNIX UNTRUSTED LEARNING CANDIDATE >>>
Candidate: <id>
Statement-SHA256: <64hex>
Source-Tasks: <ids>
Evidence: <ids>
Findings: <categories|none>
Statement-JSON: <quoted JSON string>
<<< END HARNIX UNTRUSTED LEARNING CANDIDATE >>>
```

`eligible` vẫn lấy từ `isPromotionEligible()`. Review metadata là returned object, không persisted journal migration. Không action nào write spec.

### Doctor

Doctor journal traversal reuse safe existing journal reader. Với mỗi logical journal path, union risk categories của valid learning entries và emit tối đa một `persistent-learning-suspicious` warning. Message chỉ category; no candidate ID/body/match. Finding `fixable:false`; fix plan không nhận handler.

## 5. CAP-04 repo-map graph

### Safe resolver

`buildRepoMapGraph(records, limits)` tạo index `path -> record`. Với mỗi sorted record/importTarget:

1. Chỉ nhận `./` hoặc `../`.
2. Resolve POSIX relative theo `dirname(record.path)` và normalize repository path; traversal/absolute/null bị bỏ.
3. Candidate order: exact indexed path, extensionless indexed matches, `<target>/index.*` matches.
4. Dedupe/sort; nếu >4 candidates thì bỏ target; nếu 1..4 thì thêm directed edges source→candidate đến hard cap.

External/bare imports không thành nodes. Graph output adjacency/reverse-adjacency sorted; không persist.

### Query algorithm

1. MiniSearch tạo lexical top-50 như v1.
2. Seeds = lexical IDs ∪ safe `relevantPaths` có trong map.
3. Ranker v2 breadth-first inbound/outbound đến depth 2, expanded candidates cap 200.
4. Base score dùng hàm hiện có; graph bonus theo bảng PRD, mỗi reason unique.
5. Centrality dùng capped inbound degree trong resolved graph.
6. Sort score desc/path code-unit asc; slice public limit.

`RepoMapRankingOptions.rankerVersion` chỉ internal/injected; `queryRepoMap()` default v2. Version 1 bypass graph/expansion và phải byte-semantic parity với golden v1 results. Public command không nhận flag và output fields không đổi.

### Resource bounds

Graph builder dừng deterministic ở 10k nodes/100k edges; input map validator vẫn là trust gate. Query không read filesystem/cache body ngoài map đã load. Candidate/reason arrays bounded. No new dependency.

## 6. Cross-CAP integration

- CAP-04 không thay CAP-01 context hook; nếu future context selector dùng repo-map ranker, tăng `selectorVersion` trong cùng change. Trong scope hiện tại CAP-01 bind cache inventory và current context selector only.
- CAP-02 skill/template updates phải mô tả CAP-01 `selectionChanges` và giữ Continue replan semantics.
- CAP-03 Doctor addition không được biến warnings thành auto-fix hoặc project-data rewrite.
- All diagnostics use logical relative paths; release scan checks secrets/machine paths.

## 7. Failure/rollback matrix

| Failure | Behavior | Recovery |
|---|---|---|
| sidecar/cache invalid | stale/fail closed, no auto refresh | explicit reselect/doctor fix |
| ready trace invalid | reject transition, JSON diagnostics | user/Brainstorm edits artifacts |
| learning suspicious | warning + serialized review | explicit human decision, no fix |
| graph target unsafe/ambiguous | omit edge deterministically | lexical/other graph signals remain |
| resource cap reached | deterministic truncation | version 1 rollback or smaller map |

Mỗi CAP có pure module boundary để revert không migrate persisted TaskRecord/config/journal/repo-map. CAP-01 sidecar là artifact mới duy nhất; các CAP khác không thêm persisted project schema.

## 8. Verification architecture

- CAP-01: canonicalization, corrupt/future/binding, content/selection precedence, hook no-I/O.
- CAP-02: table-driven grammar/diagnostics, hidden JSON, transition matrix, Lite/legacy, skill/template eval.
- CAP-03: injection corpus, golden serialized proposal, hash/provenance, Doctor redaction/no-fix, Unicode.
- CAP-04: resolver/property caps, v1 parity/v2 golden ranking, integration/cache-only, safety.
- Cross: build/lint/typecheck, workflow/safety/integration/unit, release scan, full acceptance/package/smoke/performance/footprint.

Test fixtures use temp repositories và injected fake homes; không chạm real profile hoặc real network.