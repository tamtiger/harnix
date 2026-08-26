# PRD — Phục hồi task và giải thích context/check freshness

## Outcome

Harnix bổ sung một vòng trải nghiệm local rõ ràng: dùng `tasks` để tìm TaskRecord, `resume` để nối lại exact unfinished task, `context-report` để biết Harnix sẽ đưa file nào vào hook context và `checks` để biết vì sao required verification chưa fresh. Ba lệnh dùng state hiện có, JSON-only, không tạo session store hoặc runtime service mới.

### AC `ac-current-research`

Research ngày 2026-08-26 phải ghi primary mechanism evidence, real-usage signal, immutable refs/licenses, local reproduction, facts/inferences và weighted decision matrix. Chỉ candidate vượt hard gate fit, privacy/safety và license mới được triển khai.

### AC `ac-delivered-value`

Ba feature được triển khai theo các contract dưới đây bằng RED–GREEN–REFACTOR, có focused unit/integration regressions và cùng pass full acceptance. Không chấp nhận output chỉ mang tính mô tả tài liệu.

### AC `ac-product-boundaries`

Mọi behavior giữ một package/bin, chỉ hỗ trợ Kiro, Antigravity và Codex, local/offline deterministic, không telemetry/network/daemon/session transcript/global memory/Git automation. Public output dùng relative metadata và tối đa 262144 UTF-8 bytes; khi detail không vừa, bỏ tail theo deterministic order và đặt cờ truncation, không cắt chuỗi path/ID thành giá trị gây hiểu nhầm.

### AC `ac-provenance`

Registry machine-checkable phải thêm `context-selection-explanation`, `task-resume-recovery` và `verification-freshness-explanation` theo code-unit order. Mỗi entry ghi immutable ref, access date, license, evidence URL, adaptation delta và existing code/test/docs paths; source user-report chỉ là usage signal, không phải code provenance.

### AC `ac-quality-release`

Canonical docs, README, CHANGELOG và package patch version đồng bộ. Compliance review chạy trước quality/security review; focused checks, acceptance và release sequence đều cần fresh evidence với matching input digest trước finish.

### AC `ac-task-resume`

Public syntax là `harnix resume <task-id> [--dry-run]`.

Success schema v1:

```json
{
  "generator": "harnix",
  "schemaVersion": 1,
  "scope": "project",
  "dryRun": false,
  "outcome": "resumed",
  "task": {
    "id": "20260826-120000-example-task",
    "mode": "full",
    "status": "in_progress",
    "checkpoint": "implementing"
  },
  "nextAction": {
    "code": "inspect-active-task",
    "message": "Run harnix status to inspect the selected task."
  }
}
```

- `outcome` là `would-resume`, `resumed` hoặc `already-active`; `dryRun` phản ánh flag.
- Candidate ID phải canonical, directory/record ID khớp, record không quá 1 MiB, schema hợp lệ và status không phải `completed|cancelled`.
- Active pointer absent/empty cho phép `would-resume` hoặc atomic write thành `resumed`. Cùng exact pointer trả `already-active` không write.
- Pointer quá 1 KiB, malformed, dangling, trỏ record invalid/terminal, hoặc trỏ task khác đều fail closed bằng standard public error JSON exit 2; không overwrite.
- Dry-run thực hiện đủ validation/collision checks nhưng snapshot filesystem trước/sau phải giống nhau.
- Mutation duy nhất là permission-preserving atomic replacement của `.harnix/tasks/.active`; không đổi TaskRecord timestamp/status/checkpoint/evidence/artifact, không chạy workflow transition và không phục hồi transcript/Git/model state.
- Không tuyên bố cross-process compare-and-swap guarantee mới; behavior tuần tự là atomic và fail closed theo state quan sát được.

### AC `ac-context-report`

Public syntax là `harnix context-report --platform <kiro|antigravity|codex> [--limit <1..50>]`; default limit là 20.

No-active schema giữ các field top-level và `activeTask: null`. Với active task, `activeTask` gồm:

- `id`, `budget: { maxCharacters, maxEntries }`;
- `drift: { state, changeCount, returnedChanges, changesTruncated, changes, selectionChanges }`;
- `summary: { candidates, selected, omitted, returnedSelected, returnedOmitted, selectedTruncated, omittedTruncated, detailsTruncated }`;
- `selected[]` item `{ path, reasonCodes, priority, pinned }`;
- `omitted[]` item `{ path, reason }`.

Contract hành vi:

- Dùng cùng effective builder với hidden `harnix context`, ở bounded hook mode: Codex cap 2500 characters; Kiro/Antigravity cap `min(config.context.maxCharacters, 8000)`; max 64 inspected entries.
- Khi chưa có `context.json`, candidate là task `relevantPaths` cộng applicable guides. Khi có manifest, dùng persisted entries cộng applicable guides. Selection/omission phải đúng kết quả `buildContext` thực sự, không có thuật toán report riêng.
- Trusted `reasonCodes` chỉ gồm `applicable-guide`, `persisted-selection`, `pinned`, `task-reference`, sorted code-unit. Omitted reason chỉ gồm `budget|duplicate|missing|unsafe`; drift kind giữ enum hiện có.
- `--limit` áp dụng riêng cho selected, omitted và drift changes. Toàn result vẫn chịu byte cap; mọi tail/entry quá lớn bị bỏ nguyên item và được phản ánh bằng count/cờ truncation.
- Không trả content, raw persisted `reason`, `states`, `contentHash`, title/goal/criterion, absolute path hoặc hook event. Command read-only, no-network, no-write.
- Refactor shared builder không làm đổi platform payload/activation guard/omission disclosure của hidden context; regression hiện có phải tiếp tục pass.

### AC `ac-checks-report`

Public syntax là `harnix checks [--limit <1..50>]`; default limit là 20. No-active schema giữ top-level và `activeTask: null`.

Với active task, `activeTask` gồm metadata `id|mode|status|checkpoint`, aggregate `summary` và sorted `checks`. Mỗi check item là:

```json
{
  "id": "focused-gate",
  "state": "stale",
  "reasonCodes": ["inputs-changed"],
  "changeSummary": {
    "changed": 1,
    "missing": 0,
    "returned": 1,
    "truncated": false
  },
  "changes": [
    { "path": "src/example.ts", "kind": "changed" }
  ]
}
```

- Chỉ required checks; check IDs sort code-unit. `--limit` giới hạn check records. Mỗi check trả tối đa 20 path changes; toàn result chịu byte cap và summary có `returned|resultTruncated|detailsTruncated`.
- Latest evidence giữ persisted append-order tie behavior. State là `passed|failed|stale|pending`.
- Trusted reason codes sort code-unit và chỉ gồm `evidence-expired`, `inputs-changed`, `inputs-missing`, `inputs-unavailable`, `latest-failed`, `latest-skipped`, `no-evidence`, `snapshot-invalid`, `snapshot-mismatch`, `snapshot-missing`, `task-contract-changed`.
- Không evidence → pending/`no-evidence`; latest skipped → pending/`latest-skipped`; latest fail → failed/`latest-failed`; pass ngoài freshness window hoặc timestamp tương lai/invalid → stale/`evidence-expired`.
- v1 fresh pass → passed. v2 fresh pass yêu cầu matching valid sidecar snapshot/evidence digest; missing/invalid/mismatch được phân loại mà không throw private detail. Current recomputation failure → stale/`inputs-unavailable`.
- Khi digest đổi, so task contract hash và entries: thêm/sửa path là `changed`, path biến mất là `missing`; reason phản ánh `task-contract-changed`, `inputs-changed`, `inputs-missing`. Digest đổi nhưng không giải thích được dùng `snapshot-mismatch`.
- Không trả check description/command, evidence ID/summary/time/hash/input patterns, criterion prose, task prose hoặc absolute path. Không chạy command, không sửa sidecar/evidence/task và không network.



