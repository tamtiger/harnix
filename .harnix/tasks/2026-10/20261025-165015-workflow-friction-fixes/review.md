# Sửa 5 điểm ma sát workflow: init với --with-check, --remove-risk, git dirty do CRLF, doctor --fix artifact Full, set-criterion khi implementing

- **ID:** 20261025-165015-workflow-friction-fixes
- **Mode:** lite
- **Status:** completed/finishing
- **Created:** 2026-10-25 16:50:15 +07:00
- **Updated:** 2026-10-25 17:05:10 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 5/5 met or waived |
| Required checks | 100% | 4/4 passed |

## Goal

Gỡ các ma sát thực tế khi dùng harnix: --init không đòi --command khi đã có --with-check, thêm --remove-risk, git clean bỏ qua khác biệt EOL, doctor --fix tạo prd.md/plan.md thiếu của task Full, và --set-criterion sửa chữ tiêu chí ở implementing có ghi vết.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +2 / -2 |
| `docs/HARNIX_WORKFLOW.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/commands/workflow-command.ts` | modified | +1 / -0 |
| `src/commands/workflow-edit-handlers.ts` | modified | +3 / -1 |
| `src/commands/workflow-flag-owners.ts` | modified | +2 / -1 |
| `src/commands/workflow-flags.ts` | modified | +4 / -2 |
| `src/core/doctor/doctor.ts` | modified | +6 / -0 |
| `src/core/doctor/restore-artifacts.ts` | added | - |
| `src/core/workflow/brief.ts` | modified | +1 / -0 |
| `src/core/workflow/index.ts` | modified | +1 / -1 |
| `src/core/workflow/init-task.ts` | modified | +9 / -3 |
| `src/core/workflow/plan-remove.ts` | modified | +15 / -0 |
| `src/core/workflow/schema.ts` | modified | +2 / -0 |
| `src/core/workflow/set-criterion.ts` | modified | +29 / -2 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/references/cookbook-commands.md` | modified | +1 / -0 |
| `src/templates/harnix/workflow.md` | modified | +2 / -1 |
| `src/utils/git.ts` | modified | +17 / -1 |
| `test/support/workflow-fixtures.ts` | modified | +5 / -2 |
| `test/unit/commands/workflow-edit-handlers.test.ts` | modified | +16 / -3 |
| `test/unit/commands/workflow-handlers.test.ts` | modified | +1 / -0 |
| `test/unit/core/doctor/restore-artifacts.test.ts` | added | - |
| `test/unit/core/workflow/index.test.ts` | modified | +1 / -0 |
| `test/unit/core/workflow/init-task.test.ts` | modified | +17 / -0 |
| `test/unit/core/workflow/plan-remove.test.ts` | modified | +17 / -2 |
| `test/unit/core/workflow/set-criterion.test.ts` | modified | +9 / -2 |
| `test/unit/core/workflow/target-task.test.ts` | modified | +1 / -0 |
| `test/unit/utils/git.test.ts` | modified | +18 / -0 |
| `test/workflow/behavior-snapshot.golden.json` | modified | +2 / -0 |
| `test/workflow/cli-contract.test.ts` | modified | +1 / -0 |

## Acceptance criteria

- [x] `ac-1` (met): harnix workflow --init không đòi --command khi đã truyền --with-check và dự án không có lệnh test mặc định
- [x] `ac-2` (met): harnix workflow --remove-risk <id> gỡ một residual risk của task chưa kết thúc
- [x] `ac-3` (met): readGitContext coi cây làm việc là sạch khi mọi khác biệt chỉ là cuối dòng CRLF/LF
- [x] `ac-4` (met): doctor --fix tạo prd.md và plan.md còn thiếu của task Full chưa kết thúc từ mẫu chuẩn và không ghi đè file có sẵn
- [x] `ac-5` (met): --set-criterion đổi chữ tiêu chí ở in_progress/implementing của task Lite chưa có evidence mà không cần replan thủ công, bắt buộc --reason và lý do được giữ làm vết sửa hợp đồng

## Required checks

- [x] `check-1` (focused): Kiểm chứng: Sửa 5 điểm ma sát workflow: init với --with-check, --remove-risk, git dirty do CRLF, doctor --fix artifact Full, set-criterion khi implementing — pass (2026-10-25 17:02:26 +07:00)
- [x] `check-focus` (focused): Test tập trung cho 5 điểm sửa — pass (2026-10-25 17:02:35 +07:00)
- [x] `check-gates` (focused): Contract gates — pass (2026-10-25 17:02:42 +07:00)
- [x] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-25 17:04:52 +07:00)

## Evidence

- `check-1` — pass (2026-10-25 17:02:26 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-focus` — pass (2026-10-25 17:02:35 +07:00): pnpm exec vitest run test/unit/core/workflow/set-criterion.test.ts test/unit/core/workflow/init-task.test.ts test/unit/core/workflow/plan-remove.test.ts test/unit/utils/git.test.ts test/unit/core/d... — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-gates` — pass (2026-10-25 17:02:42 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-25 17:04:52 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
