# Plan - workflow --schema một nguồn sự thật, bỏ --human

## Implementation checklist

- [x] `S1-SCHEMA-SOURCE` — RED rồi export manifest từ task.ts và derive workflowEnvelopeSchema từ đó.
- [x] `S2-DROP-HUMAN` — RED rồi xoá --human khỏi CLI, xoá human-report.ts, cập nhật docs.
- [ ] `S3-RELEASE` — Bump patch version, chạy exact acceptance sequence.

### Slice `S1-SCHEMA-SOURCE`

Criteria: `ac-schema-single-source`
Checks: `focused-schema-source`
Paths: `src/core/tasks/task.ts`, `src/commands/internal-workflow.ts`, `test/workflow/internal-workflow.test.ts`

RED: test import trực tiếp manifest thật từ `task.ts` và deep-equal với output `workflow --schema`; thất bại vì schema vẫn hardcode. GREEN: export `TASK_RECORD_FIELDS`/`taskRecordFieldManifest` và các key-set lồng nhau, sửa `workflowEnvelopeSchema()` gọi thẳng chúng. Xác nhận bằng cách tạm thêm field giả vào manifest (không sửa internal-workflow.ts) và thấy nó tự xuất hiện trong output, rồi revert.

### Slice `S2-DROP-HUMAN`

Criteria: `ac-human-removed`
Checks: `focused-drop-human`
Paths: `src/cli-program.ts`, `test/workflow/cli-contract.test.ts`, `test/integration/status.test.ts`

RED: test khẳng định 4 command không còn option `--human`. GREEN: xoá option/flag khỏi `status/tasks/checks/audit`, xoá `emitReport`/import `renderHumanReport`, xoá `src/commands/human-report.ts` và `test/integration/human-report.test.ts`, thay test cũ bằng test khẳng định `--human` bị reject (exit 2, `unknown option`).

### Slice `S3-RELEASE`

Criteria: `ac-release-readiness`
Checks: `release-gate`
Paths: `AGENTS.md`, `README.md`, `docs/IMPLEMENTATION_PLAN.md`, `CHANGELOG.md`, `package.json`

Xoá mọi mô tả `--human` còn sót trong docs, bump patch version một lần, chạy exact acceptance sequence.

<!-- harnix:execution-notes:begin -->
<!-- harnix:execution-notes:end -->
