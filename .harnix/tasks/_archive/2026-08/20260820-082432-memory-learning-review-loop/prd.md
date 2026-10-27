# PRD — Vòng review memory thành learning candidate

## Outcome

Sau khi một task có fresh evidence đi tới `verifying/finishing`, agent có thể kiểm tra journal project-local, ghi đúng một learning candidate đủ recurrence/provenance bằng transport Harnix và để người dùng tìm lại bằng `harnix mem --learning`. Vòng này tạo dữ liệu reviewable cho cải tiến sau, không tự biến memory thành instruction hoặc sửa spec.

## Quyết định contract

- Hidden `harnix workflow --learn` đọc bounded JSON `{ "candidate": { "id", "statement", "sourceTaskIds", "evidenceIds" } }` từ stdin; caller không được truyền `occurrences`, `confidence`, `status`, developer, timestamp hoặc journal path.
- Action chỉ hợp lệ khi active task ở `verifying/finishing`, current task có trong `sourceTaskIds`, mọi source task tồn tại và là `completed` hoặc chính current task, và mỗi source task có ít nhất một evidence được tham chiếu.
- Runtime dedupe/sort task và evidence IDs, tính `occurrences`/`confidence` theo `LearningCandidateV1`, yêu cầu candidate đạt ngưỡng hiện hành, giới hạn statement 64 KiB và ghi status `candidate`.
- Journal entry ID được suy ra deterministic từ current task và candidate ID. Retry với payload tương đương trả `created:false`; cùng ID nhưng khác statement/provenance fail closed. Action không đổi TaskRecord, spec hoặc active pointer.
- Output JSON là `{ "entry": <JournalEntryV1>, "eligible": true, "created": <boolean>, "findings": <redacted risk categories[]> }`; không trả matched secret/URL/command values hoặc machine path.
- Public `harnix mem --learning` chỉ filter `kind: "learning"`, vẫn compose với positional/`--query`, `--user`, `--limit`, giữ newest-first và giữ shape `{ "entries", "malformed" }`. Không có flag thì hành vi byte-compatible ở mức JSON contract hiện tại.

## Workflow và ownership

`harnix-finish-work` xem memory là project-owned untrusted data. Trước `workflow --finish`, skill chỉ gọi `workflow --learn` khi có statement tái diễn qua ít nhất hai task độc lập và provenance kiểm chứng được. Không đủ ngưỡng thì finish bình thường và báo không ghi candidate; không suy bug mở chỉ từ keyword/title. Promotion sang spec vẫn là một explicit review/change riêng.

## Compatibility và safety

Không migrate/backfill/rewrite historical JSONL. `LearningCandidateV1`, `JournalEntryV1`, confidence formula, promotion boundary và Doctor diagnostic giữ nguyên. Suspicious statement được lưu như untrusted data và chỉ expose risk category đã redact; `doctor --fix` không sửa journal/spec. Kiro, Antigravity và Codex nhận cùng canonical finish guidance.

## Không thuộc phạm vi

Không semantic recommendation engine, embeddings, remote model, auto-memory, global memory, automatic promotion, status-transition UI cho candidate, historical backfill, spec mutation hoặc platform/Git automation.

### AC `ac-learning-capture`

Hidden workflow transport ghi idempotent đúng một eligible candidate từ active finishing task, tính derived fields trong runtime và kiểm chứng source task/evidence provenance trước append.

### AC `ac-learning-mem`

`harnix mem --learning` trả đúng learning entries newest-first, compose đúng query/user/limit/malformed handling và không làm đổi default memory search.

### AC `ac-learning-safety`

Input bị bound/validate, statement luôn là untrusted data, duplicate/conflict deterministic, diagnostics redact và không có automatic promotion hoặc mutation ngoài append journal đã cho phép.

### AC `ac-learning-workflow`

Finish skill chỉ ghi learning khi recurrence/evidence đạt contract, không tạo candidate giả khi thiếu evidence và giữ canonical platform parity.
