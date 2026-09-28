# Plan — Gỡ code chết và gộp status --explain

## Checklist

- [x] `S1` — Gỡ dead-code và test mồ côi
- [x] `S2` — Gộp checks/audit vào status --explain (giữ redaction)
- [x] `S3` — Suite tương thích dữ liệu cũ
- [x] `S4` — Đồng bộ docs và CHANGELOG

## Slices

### Slice `S1`
Criteria: `ac-removed`
Checks: `check-suite`
Paths: `src/migration/**`, `src/rules/rules.ts`, `src/core/research.ts`

Gỡ module không caller cùng test mồ côi; sửa test còn tham chiếu.

### Slice `S2`
Criteria: `ac-status-explain`, `ac-cli-breaking`
Checks: `check-suite`
Paths: `src/commands/status.ts`, `src/cli-program.ts`, `test/integration/checks.test.ts`, `test/integration/audit.test.ts`

Thêm `explainProjectStatus` với redaction, bỏ 2 lệnh, chuyển integration test.

### Slice `S3`
Criteria: `ac-compat`, `ac-migration-suite`
Checks: `check-legacy-compat`
Paths: `test/migration/legacy-data-compat.test.ts`

Suite đọc task v1/v2 và context.json.

### Slice `S4`
Criteria: `ac-docs-sync`
Checks: `check-docs-sync`
Paths: `docs/HARNIX_PRD.md`, `docs/HARNIX_WORKFLOW.md`, `docs/IMPLEMENTATION_PLAN.md`, `README.md`, `CHANGELOG.md`

Cập nhật docs và CHANGELOG cho breaking change.
