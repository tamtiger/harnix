# Plan - Mở đường cho mọi agent và làm task review được

## Implementation checklist

- [x] `S1-SKILL-CLI` — RED rồi thêm public command `harnix skill [name]`.
- [x] `S2-TEMPLATE-REACH` — RED rồi trỏ AGENTS/workflow template tới nguồn skill và guides có thật.
- [x] `S3-TRANSPORT` — RED rồi thêm `workflow --transition`, `--evidence`, `--schema`.
- [x] `S4-TRANSPORT-DOCS` — RED rồi mô tả transport mới trong skill canonical và workflow template.
- [x] `S5-TASK-RATIONALE` — RED rồi thêm trường v2 tuỳ chọn `decisions`/`residualRisks` và guidance ghi chúng.
- [x] `S6-HUMAN-VIEW` — RED rồi thêm `--human` cho status/tasks/checks/audit.
- [x] `S7-DOCS-RELEASE` — Đồng bộ normative docs, minor release và chạy exact acceptance sequence.

### Slice `S1-SKILL-CLI`

Criteria: `ac-skill-reach`
Checks: `focused-skill-cli`
Paths: `src/commands/skills.ts`, `src/cli-program.ts`, `src/skills/catalog.ts`, `test/integration/skills.test.ts`, `test/workflow/cli-contract.test.ts`

Viết RED cho catalog bảy skill, nội dung byte-identical, tên không hợp lệ fail closed và command chạy được ngoài project. Sau đó thêm command thuần đọc từ catalog đã nhúng, không I/O project và không ghi.

### Slice `S2-TEMPLATE-REACH`

Criteria: `ac-template-reach`
Checks: `focused-skill-cli`, `managed-parity`
Paths: `src/templates/harnix/agents.ts`, `src/templates/harnix/workflow.ts`, `test/workflow/templates.test.ts`, `test/unit/activation-instructions.test.ts`

Thêm assertion chứng minh template không tham chiếu nguồn skill không tồn tại sau init, có nêu `harnix skill` và `.harnix/spec/guides/`, rồi mới sửa prose canonical.

### Slice `S3-TRANSPORT`

Criteria: `ac-bounded-transport`
Checks: `focused-transport`
Paths: `src/commands/internal-workflow.ts`, `src/cli-program.ts`, `test/workflow/internal-workflow.test.ts`, `test/workflow/cli-contract.test.ts`

Viết RED cho transition hợp lệ, transition bất hợp lệ fail closed, evidence append giữ lịch sử, và schema là read-only. Sau đó implement ba action dùng lại validation/lock hiện có.

### Slice `S4-TRANSPORT-DOCS`

Criteria: `ac-bounded-transport`, `ac-contract-docs-sync`
Checks: `managed-parity`
Paths: `src/skills/harnix-implement/SKILL.md`, `src/skills/harnix-brainstorm/SKILL.md`, `src/skills/harnix-check/SKILL.md`, `src/skills/harnix-continue/SKILL.md`, `src/templates/harnix/workflow.ts`, `test/workflow/skill-sources.test.ts`

Thêm needle assertion cho transport mới trước, rồi mô tả trong skill canonical và workflow template khi nào dùng transition/evidence thay cho save đầy đủ.

### Slice `S5-TASK-RATIONALE`

Criteria: `ac-task-rationale`
Checks: `focused-task-rationale`
Paths: `src/core/tasks/task.ts`, `src/skills/harnix-brainstorm/SKILL.md`, `src/skills/harnix-finish-work/SKILL.md`, `test/unit/task-state.test.ts`, `test/unit/verification-inputs.test.ts`

Viết RED cho v2 chấp nhận hai trường, v1 từ chối, id/text bounded, và `taskContractHash` không đổi. Sau đó tách key set theo schemaVersion và thêm validation tối thiểu.

### Slice `S6-HUMAN-VIEW`

Criteria: `ac-human-review`
Checks: `focused-human-view`
Paths: `src/commands/human-report.ts`, `src/cli-program.ts`, `test/integration/human-report.test.ts`, `test/integration/status.test.ts`

Viết RED chứng minh không flag vẫn là đúng một JSON document, `--human` in tóm tắt đọc được, và output không lộ absolute path. Sau đó thêm renderer thuần từ result đã có.

### Slice `S7-DOCS-RELEASE`

Criteria: `ac-contract-docs-sync`, `ac-release-readiness`, `ac-skill-reach`
Checks: `managed-parity`, `release-gate`
Paths: `AGENTS.md`, `README.md`, `CHANGELOG.md`, `docs/HARNIX_PRD.md`, `docs/IMPLEMENTATION_PLAN.md`, `package.json`, `.harnix/.template-hashes.json`

Cập nhật số lượng public command, transport, trường TaskRecord và nguồn skill trong mọi normative doc, bump minor đúng một lần qua `pnpm version:sync`, rồi chạy compliance review trước quality review và exact acceptance sequence.

<!-- harnix:execution-notes:begin -->
<!-- harnix:execution-notes:end -->
