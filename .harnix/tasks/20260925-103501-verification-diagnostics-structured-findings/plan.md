# Implementation Plan: Verification Diagnostics & Structured Findings

## Checklist

- [x] `S1` — Mở rộng capture failure context trong evidence recording
- [x] `S2` — Cập nhật hiển thị findings trong checks report
- [x] `S3` — Bổ sung unit tests cho verification diagnostics

### Slice `S1`

Criteria: `ac-structured-findings-capture`
Checks: `check-findings-capture`
Paths: `src/core/verification/input-freshness.ts`, `src/core/tasks/task.ts`

### Slice `S2`

Criteria: `ac-checks-reporting-findings`
Checks: `check-checks-report`
Paths: `src/commands/checks.ts`, `src/core/verification/check-report.ts`

### Slice `S3`

Criteria: `ac-diagnostics-unit-tests`
Checks: `check-diagnostics-tests`
Paths: `test/unit/check-report.test.ts`, `test/unit/verification-inputs.test.ts`
