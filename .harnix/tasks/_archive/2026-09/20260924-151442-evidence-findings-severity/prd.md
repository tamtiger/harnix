# PRD: Structured findings với severity trên EvidenceRecordV2

## Outcome

Cho phép một evidence pass/fail đính kèm danh sách `findings[]` có `severity` máy đọc được (thay vì chỉ có `summary` văn xuôi tự do), để Stage-2 review (harnix-check) có thể lọc/ưu tiên theo mức độ nghiêm trọng thay vì phải đọc hết văn bản để tự suy luận severity.

## Scope

- Thêm optional field `findings?: EvidenceFindingV1[]` vào `EvidenceRecordV2`, mỗi finding có `id`, `text`, `severity` (`low|medium|high|critical`).
- Cập nhật `docs/IMPLEMENTATION_PLAN.md` §4.3 (frozen contract), `docs/HARNIX_WORKFLOW.md`, `docs/HARNIX_PRD.md` nếu cần, cùng validator (`validateTask`) và test đồng thời trong cùng thay đổi.
- `findings` là optional — evidence cũ không có field này vẫn hợp lệ (backward-compatible, không cần migration).

## Non-goals

- Không bắt buộc mọi evidence phải có `findings`.
- Không đổi cách tính `taskContractHash` hay ready-trace grammar v1.
- Không tự động sinh `findings` từ review — vẫn do agent/reviewer điền thủ công khi thấy cần.

## Acceptance criteria

### AC `finding-field-additive`

`EvidenceRecordV2` có thêm optional `findings?: EvidenceFindingV1[]`; `validateTask` chấp nhận evidence có/không `findings`, reject `findings` trên `EvidenceRecordV1` (unknown field).

**Verifies:** `chk-finding-schema-unit`

### AC `finding-shape-validated`

Mỗi `EvidenceFindingV1` phải có `id` (safe slug), `text` (non-empty, bounded), `severity` thuộc đúng 4 giá trị `low|medium|high|critical`; sai bất kỳ field nào bị reject với thông báo rõ ràng.

**Verifies:** `chk-finding-shape-unit`

### AC `docs-and-frozen-contract-synced`

`docs/IMPLEMENTATION_PLAN.md` §4.3 mô tả đúng `EvidenceFindingV1`/`findings?` như frozen contract mới; `docs/HARNIX_WORKFLOW.md` (nếu có bảng liệt kê Evidence fields) đồng bộ.

**Verifies:** `chk-docs-parity`

### AC `regression-safe`

Toàn bộ test hiện có liên quan evidence/task validation không regression hành vi cũ.

**Verifies:** `chk-full-regression`
