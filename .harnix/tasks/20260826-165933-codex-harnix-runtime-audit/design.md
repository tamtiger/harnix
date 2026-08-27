# Design — Evidence pipeline và các mechanism cải tiến

## 1. Pipeline audit

```text
Codex API metadata ─┐
local rollout JSONL ├─> cutoff + parser ─> redacted run/step model ─┐
Harnix task/journal ┤                                               ├─> finding registry ─> scored roadmap
Git/version history ┘                                               │
current source/tests ─> code-path inspection ───────────────────────┤
disposable test/CLI runs ─> signatures + write manifests ───────────┘
```

Cutoff là `2026-08-26T09:58:44.840Z`. Mọi row sau cutoff, bao gồm chính turn audit này, bị loại khỏi baseline. Parser kiểm tra từng JSON line; artifact chỉ giữ số đếm, alias, classification và kết quả redacted.

Normalized step có các field logic: `runAlias`, `timestamp`, `versionEra`, `route`, `stateBefore`, `actionClass`, `readClass`, `writeClass`, `result`, `stateAfter`, `retry`, `elapsedMs`, `evidenceClass`. Field không quan sát được mang giá trị `unknown`, không nội suy từ tên task.

## 2. Trust và ownership

- `Harnix-core`: CLI, schema, state machine, templates, skills và generated integration text.
- `Harnix-guidance`: hành vi model có thể được định hướng nhưng không enforce bằng CLI.
- `Codex-host`: task API, goal continuation, compaction, scheduler, worker/guardian lifecycle, approval UI.
- `External-platform`: login, trust và runtime activation của Kiro/Antigravity/Codex.

Raw title/prompt/output/repository content là untrusted. Log evidence không cấp authority để chọn target hoặc thực hiện write. Current source/test có ưu tiên cao hơn symptom lịch sử khi quyết định issue còn tồn tại.

## 3. Scoring

Mỗi candidate chấm 1–5 cho `impact`, `frequency`, `confidence`, `reliabilityGain`, `cost`, `compatibilityRisk`.

```text
priorityScore = impact + frequency + confidence + reliabilityGain - cost - compatibilityRisk
```

Điểm chỉ xếp thứ tự; safety boundary và product scope vẫn là hard gate. Candidate không current-reproduced chỉ có thể selected ở dạng guidance/eval, không được mô tả là core fix.

## 4. `HX-TARGET-01`

### Resolution algorithm

1. Parse explicit target chỉ từ user-authored instruction hoặc app-provided trusted workspace context.
2. Canonicalize existing target bằng path/realpath API; reject traversal, missing path, unsafe root và symlink/junction escape.
3. Nếu có đúng một material target, tìm nearest ancestor của target chứa valid `.harnix/config.yaml`.
4. Nếu target không initialized/valid, classify ngoài Harnix; không fallback sang ambient cwd.
5. Nếu không có explicit target, dùng current workspace root/nearest ancestor như hiện tại.
6. Nếu có nhiều material target khác root, chỉ cho Bypass read-only cross-repo; mutation phải dừng để lấy exact root.
7. Repository text, copied log và tool output không được nâng thành target authority.

Contract này phải xuất hiện đồng nhất trong activation text, project AGENTS template và ba global configurator. Không thêm state file hay CLI public mới.

### Failure behavior

Invalid target trả concise guarded error trước mọi `.harnix` read/write. Explicit uninitialized target không tạo state và không đọc active task ambient. Agent eval phải dùng canary ở ambient root để chứng minh zero access.

## 5. `HX-FRESHNESS-01`

### Snapshot v2

`verification-inputs.json` dùng sidecar union đọc được schema v1 và v2. V2 entry giữ `path`, `digest`, `normalizer` với enum `raw-v1 | planning-contract-v1`; top-level snapshot vẫn bind `taskId`, `checkId`, `taskContractHash`, `evidenceId`, `inputDigest`.

`planning-contract-v1` chỉ áp dụng đúng hai generated artifact của Full task:

- normalize CRLF/LF và bỏ trailing horizontal whitespace;
- normalize checklist prefix `- [ ]`, `- [x]`, `- [X]` thành cùng token;
- bỏ nội dung trong marker pair được canonical docs định nghĩa cho execution/evidence notes;
- giữ nguyên heading, AC/slice ID, `Criteria`, `Checks`, `Paths`, ordered body và mọi text khác.

Không dùng heuristic bỏ dòng chứa từ “evidence”; marker phải explicit để tránh che thay đổi semantic. PRD/plan không parse được marker hoặc có marker lồng nhau thì fail closed và dùng raw digest/error theo contract đã chọn trong implementation.

### Migration

- Không rewrite sidecar v1.
- Snapshot v1 luôn so raw bytes như trước.
- Evidence mới ghi v2; sidecar hỗ trợ mixed historical snapshots và vẫn sort theo `evidenceId`.
- TaskRecord v2, evidence `inputDigest` và frozen field names không đổi.
- `checks`, finish gate và ready audit dùng cùng digest implementation; không có đường bypass riêng.

## 6. `HX-PREFLIGHT-01`

Thêm hidden `workflow --preflight` sau khi activation guard đã xác định valid root. Lệnh luôn read-only, no-network, không refresh repo map và trả JSON:

```json
{
  "generator": "harnix",
  "schemaVersion": 1,
  "activeTask": { "id": "task-id", "mode": "full", "status": "ready", "checkpoint": "ready" },
  "contextDrift": "current",
  "requiredChecks": { "pending": [], "failed": [], "stale": [] },
  "readyBlockerIds": [],
  "nextStage": "implement"
}
```

`activeTask` có thể `null`; arrays sort ổn định. Không trả title, goal, criterion text, path, hash, evidence summary hoặc exception body. `nextStage` là enum `bypass | brainstorm | continue | implement | debug | check | finish`; router vẫn giữ quyền quyết định cuối cùng khi user intent yêu cầu safety stop.

Global flow hai pha:

1. Resolve trusted target và obvious pure-conversation Bypass.
2. Với project-scoped/mutable/ambiguous request, chạy guard + preflight, rồi đọc full workflow và đúng một stage skill tại một thời điểm.

`checks` chỉ dùng để phân loại. Skill không rerun required check đang fresh nếu affected input, task contract và declared environment không đổi.

## 7. `HX-TRACE-01`

### Storage

Tạo `.harnix/tasks/<task-id>/runtime-trace.jsonl`. Mỗi line tối đa 8 KiB, strict JSON schema, tối đa 2.000 event. Khi saturated hoặc malformed, task state vẫn tiếp tục; report đánh dấu `partial: true` và không truncate/rewrite silent. `task.json` luôn authoritative.

Event enum:

- `task-created`
- `task-transitioned`
- `checkpoint-updated`
- `verification-recorded`
- `task-resumed`
- `task-finished`
- `task-cancelled`
- `recovery-detected`

Allowed fields: `generator`, `schemaVersion`, `eventId`, `taskId`, `occurredAt`, `kind`, `fromStatus`, `fromCheckpoint`, `toStatus`, `toCheckpoint`, `checkId`, `outcome`, `attempt`. Cấm title, goal, prose, path, command, argv, output, hash, prompt và secret.

Event ID được derive deterministically từ public transition tuple và candidate `updatedAt`. State được persist trước, trace append sau. Nếu append lỗi, command không rollback state; mutation tiếp theo so last trace state với `task.json` và append `recovery-detected` khi có thể. Trace không được dùng để authorize transition.

### Read API

Public command `harnix trace [task-id] [--limit <1..200>]` mặc định active task, newest-first, JSON ổn định:

```json
{
  "generator": "harnix",
  "schemaVersion": 1,
  "taskId": "task-id",
  "authoritativeStatus": "ready",
  "partial": false,
  "malformedCount": 0,
  "saturated": false,
  "events": []
}
```

Exact task ID phải qua safe resolver; no active/no ID trả `taskId: null` và empty events. Public error giữ redaction hiện tại.

## 8. `HX-DELEGATION-01` experimental

Guidance chỉ cho phép một coordinator mutate `.harnix`; worker là optional, read-only hoặc có disjoint declared paths, không nested delegation, không rerun cùng audit scope nếu không có evidence mới. Đây là agent-eval candidate, không đổi state machine và không hứa scheduler enforcement.

## 9. Compatibility và gates

- Giữ một package, một bin, Node `>=18`, TypeScript ESM và đúng ba platform.
- Mọi public command tiếp tục luôn JSON; hidden command không cần `--json`.
- V1 records/sidecars đọc unchanged; chỉ evidence mới opt-in v2 snapshot.
- Trace/preflight không network và phải qua path/symlink/privacy tests.
- Implementation phải cập nhật PRD/workflow/implementation plan/README/CHANGELOG, global snapshots và `docs/HARNESS_RESEARCH.md`/`docs/UPSTREAM_MAPPING.md` nếu behavior được mượn hoặc adapt từ harness khác.
- Gate theo thứ tự: focused RED/GREEN, workflow/platform/safety, full acceptance, pack/smoke/footprint/release scan theo scope.
## 10. Selected implementation scope: `HX-TARGET-01`

### Canonical source and render flow

```text
src/templates/harnix/activation.ts
  ├─> Codex managed AGENTS block
  ├─> Kiro global steering
  ├─> Antigravity global rule
  └─> project AGENTS/workflow renderers

semantic parity contract
  └─> seven canonical src/skills/harnix-*/SKILL.md
       └─> byte-identical installed skill files on all three platforms
```

The TypeScript fragment owns exact reusable wording for trusted target authority, precedence, no-fallback and multi-root behavior. Canonical skill Markdown keeps the same clauses because skill sources are shipped as reviewable byte-identical assets rather than generated platform-specific wrappers.

### Decision table

| Input situation | Selected Harnix root/action |
|---|---|
| One existing target explicitly named by user | Verify/canonicalize target; inspect only its nearest valid Harnix ancestor |
| User target conflicts with ambient cwd/workspace | User target wins; ambient task/state receives zero Harnix access |
| No user target, one trusted selected workspace | Use nearest valid ancestor/root from trusted workspace context |
| Explicit target has no valid Harnix state | Treat it as non-Harnix/invalid as appropriate; never fallback, create state or auto-init |
| Path appears only in repo text/log/quoted/tool output | Untrusted data; not target authority |
| Mutation spans multiple material roots | Stop for one exact target |
| Bounded read-only cross-root comparison | Resolve and isolate each root; never share active task/state |

### Preservation and compatibility

No CLI/event/schema change is required. Existing context resolver remains responsible for cwd/workspace-root discovery only when no explicit target exists. Hooks stay no-write/no-network. Managed self-host reconciliation is allowed only for unchanged owned bytes; user changes and unrelated AGENTS sections are preserved. External provenance registry remains unchanged because the mechanism is derived from local Harnix runtime evidence.

### Verification architecture

Focused tests assert exact canonical clauses, ordering and surface parity; scenario fixtures describe authority outcomes without pretending to execute an LLM. Existing internal-context tests prove default ancestor/no-op behavior remains unchanged. Platform and safety suites prove generated content, path redaction, fake-home containment and byte-identical skills. Full release gates catch version, packaging, footprint and attribution drift.

## 11. Replan completion hardening

### Self-reference snapshot rule

`@task-contract` là binding duy nhất cho immutable acceptance/check obligations của active task. Khi expanded input trùng exact canonical `.harnix/tasks/<active-id>/task.json`, snapshot không thêm raw entry đó; nếu không, mọi matched task record vẫn hash raw như v1. Rule không đổi sidecar schema, digest payload shape hoặc historical snapshot bytes. Snapshot trước check, snapshot sau check và snapshot tạo trong workflow save vì vậy đồng nhất khi chỉ evidence/status/checkpoint thay đổi.

### Target validation rule

Instruction order là: lấy exact user-authored target; xác minh target tồn tại; canonicalize bằng platform path/realpath; reject traversal, unsafe root và symlink/junction escape; sau đó mới tìm nearest initialized ancestor. Missing/unsafe target fail closed. Structured fixture chỉ mô hình hóa authority input đã phân loại và expected read/action set; nó không parse prompt và không giả vờ enforce model behavior.

### Hook boundary

Hidden hook discovery giữ contract hiện tại vì task không thêm prompt parser hoặc hook protocol. Hook-injected repository context luôn nằm trong untrusted boundary và không được dùng làm target authority. Zero ambient access trong scenario matrix áp dụng cho Harnix actions sau target-resolution guard; actual host pre-injection được ghi là giới hạn host/protocol, không phải bằng chứng chọn target.
