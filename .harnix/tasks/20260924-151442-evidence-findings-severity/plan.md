## Checklist triển khai

- [ ] `S1` — Type `EvidenceFindingV1` và mở rộng `EvidenceRecordV2`
- [ ] `S2` — Validator chấp nhận/reject đúng `findings`
- [ ] `S3` — Đồng bộ docs frozen contract
- [ ] `S4` — Gate rộng full regression

## Thứ tự và phụ thuộc

S1 trước tiên (định nghĩa type). S2 cần S1 (validate dựa trên type mới). S3 làm sau cùng, sau khi hành vi đã ổn định. S4 chạy sau S1-S3 để xác nhận không regression.

## Chi tiết từng slice

### Slice `S1`

**Làm gì:** Thêm `interface EvidenceFindingV1 { id: string; text: string; severity: "low" | "medium" | "high" | "critical" }` và mở rộng `EvidenceRecordV2` với `findings?: EvidenceFindingV1[]` trong `src/core/tasks/task.ts`.

**Cách kiểm chứng:** RED — test evidence có `findings` hợp lệ hiện bị reject (unknown field) vì chưa update allowlist. GREEN — thêm field vào `evidenceV2Keys` và type, test pass.

Criteria: `finding-field-additive`
Checks: `chk-finding-schema-unit`
Paths: `src/core/tasks/task.ts`, `test/unit/task-state.test.ts`

### Slice `S2`

**Làm gì:** Validate từng finding: `id` dùng lại `validId`, `text` non-empty bounded (giống `isBoundedText`), `severity` thuộc enum 4 giá trị.

**Cách kiểm chứng:** RED — test finding thiếu field/severity sai bị accept nhầm. GREEN — thêm validation loop, test pass.

Criteria: `finding-shape-validated`
Checks: `chk-finding-shape-unit`
Paths: `src/core/tasks/task.ts`, `test/unit/task-state.test.ts`

### Slice `S3`

**Làm gì:** Cập nhật `docs/IMPLEMENTATION_PLAN.md` §4.3 mô tả `EvidenceFindingV1`/`findings?` như frozen contract; đối chiếu `docs/HARNIX_WORKFLOW.md`.

**Cách kiểm chứng:** Đối chiếu thủ công (docs-only, không có RED/GREEN hành vi).

Criteria: `docs-and-frozen-contract-synced`
Checks: `chk-docs-parity`
Paths: `docs/IMPLEMENTATION_PLAN.md`, `docs/HARNIX_WORKFLOW.md`

### Slice `S4`

**Làm gì:** Chạy gate rộng xác nhận toàn bộ `test:unit` pass sau khi thêm `findings`, không regression bất kỳ đâu.

**Cách kiểm chứng:** `pnpm test:unit` pass toàn bộ, không có test nào fail do thay đổi này.

Criteria: `regression-safe`
Checks: `chk-full-regression`
Paths: `src/core/tasks/task.ts`, `test/unit/**/*.test.ts`
