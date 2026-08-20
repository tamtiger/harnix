# Plan — Trạng thái cancelled và kỷ luật tải skill

## Checklist triển khai

- [x] `S1-CONTRACT-RED` — Khóa schema/transition/CLI/journal contract và quan sát RED tests.
- [x] `S2-CANCEL-GREEN` — Implement cancellation persistence, recovery, routing và CLI transport tối thiểu.
- [x] `S3-SKILL-LOADING` — Đồng bộ workflow/templates/canonical skills cho single-owner loading.
- [x] `S4-VERIFY-RELEASE` — Review compliance, chạy fresh gates, bump patch version và cập nhật changelog.

## Thứ tự thực hiện

Behavior thay đổi dùng RED → GREEN → REFACTOR. Docs contract cập nhật cùng slice sở hữu behavior. Existing dirty work được bảo toàn; task state chỉ đi qua hidden workflow transport.

### Slice `S1-CONTRACT-RED`

Criteria: `ac-cancel-audit` `ac-cancel-compatibility` `ac-cancel-terminal`
Checks: `cancel-core-focused`
Paths: `docs/HARNIX_PRD.md` `docs/HARNIX_WORKFLOW.md` `docs/IMPLEMENTATION_PLAN.md` `test/integration/cli.test.ts` `test/unit/task-state.test.ts` `test/workflow/internal-workflow.test.ts` `test/workflow/routing.test.ts`

Thêm regression tests cho enum/final fields, cancel từ blocked, hidden JSON transport, journal/pointer order, retry recovery, illegal resume/finish và historical compatibility. Chạy focused suite để quan sát fail đúng do contract chưa được implement.

### Slice `S2-CANCEL-GREEN`

Criteria: `ac-cancel-audit` `ac-cancel-compatibility` `ac-cancel-terminal`
Checks: `cancel-core-focused`
Paths: `src/cli-program.ts` `src/commands/internal-workflow.ts` `src/core/journal/journal.ts` `src/core/tasks/task.ts` `src/core/workflow.ts`

Bổ sung pure cancellation transition, validation fields, terminal archive, cancellation journal và recovery idempotent. Expose duy nhất qua hidden `workflow --cancel` bounded stdin envelope; giữ `workflow --finish` semantics nguyên vẹn.

### Slice `S3-SKILL-LOADING`

Criteria: `ac-skill-loading`
Checks: `skill-loading-focused`
Paths: `src/skills/harnix-continue/SKILL.md` `src/skills/harnix-finish-work/SKILL.md` `src/templates/harnix/agents.ts` `src/templates/harnix/workflow.ts` `test/platform/global-adapters.test.ts` `test/workflow/skill-sources.test.ts` `test/workflow/templates.test.ts`

Ghi rõ router chỉ load current owner skill riêng đến EOF và Continue/Finish sở hữu cancelled recovery. Không batch-read stage tương lai; không duplicate platform prose. Verify canonical source và rendered bytes.

### Slice `S4-VERIFY-RELEASE`

Criteria: `ac-cancel-audit` `ac-cancel-compatibility` `ac-cancel-terminal` `ac-skill-loading`
Checks: `acceptance-suite` `doctor-cancel-focused` `release-gates` `static-quality` `version-sync-docs`
Paths: `CHANGELOG.md` `package.json` `pnpm-lock.yaml` `scripts/version-sync.mjs` `src/**/*.ts` `test/**/*.ts`

Hoàn tất version sync và build/lint/typecheck preflight để khóa implementation inputs. Sau khi checklist đóng, chuyển sang Verifying; tại đó review compliance trước quality/security rồi chạy mọi focused/broader required gate bằng snapshot trước/sau. Chỉ finish khi mọi required evidence fresh và pass.