# Gom lỗi flag của --init/--set-check và cho --init --cwd lan sang mọi check

- **ID:** 20261105-145433-batched-flag-validation
- **Mode:** lite
- **Epic:** 20261105-145432-workflow-friction-v2
- **Status:** completed/finishing
- **Created:** 2026-11-05 14:54:32 +07:00
- **Updated:** 2026-11-09 11:30:14 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 6/6 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Giảm vòng thử-sai khi khởi tạo check: validate mọi flag một lượt, gợi ý slug và scope, --init --cwd kế thừa cho mọi --with-check không khai cwd, và --init liệt kê rõ check tự sinh (cảnh báo khi trùng suite).

## Relevant paths

- `src/commands/workflow-command.ts`
- `src/core/workflow/init-spec.ts`
- `src/core/workflow/init-task.ts`
- `src/core/workflow/plan-edit.ts`
- `src/core/workflow/schema.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +18 / -0 |
| `README.md` | modified | +1 / -1 |
| `docs/HARNIX_PRD.md` | modified | +2 / -2 |
| `docs/prompts/repo-graph-tools-research.md` | added | - |
| `package.json` | modified | +1 / -1 |
| `src/commands/checks.ts` | modified | +11 / -1 |
| `src/commands/status.ts` | modified | +10 / -1 |
| `src/commands/workflow-command.ts` | modified | +0 / -2 |
| `src/core/tasks/task-state.ts` | modified | +2 / -4 |
| `src/core/tasks/transition-hint.ts` | added | - |
| `src/core/verification/input-digest.ts` | modified | +5 / -2 |
| `src/core/verification/input-hint.ts` | added | - |
| `src/core/workflow/baseline-status.ts` | added | - |
| `src/core/workflow/check-flag-issues.ts` | added | - |
| `src/core/workflow/flag-issues.ts` | added | - |
| `src/core/workflow/init-checks-notice.ts` | added | - |
| `src/core/workflow/init-issues.ts` | added | - |
| `src/core/workflow/init-spec.ts` | modified | +20 / -12 |
| `src/core/workflow/init-task.ts` | modified | +32 / -42 |
| `src/core/workflow/plan-edit.ts` | modified | +4 / -12 |
| `src/core/workflow/schema.ts` | modified | +1 / -1 |
| `src/core/workflow/secret-scan-changes.ts` | added | - |
| `src/core/workflow/secret-scan.ts` | modified | +20 / -7 |
| `src/core/workflow/suite-gate.ts` | modified | +2 / -13 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/references/epic.md` | modified | +4 / -0 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/references/cookbook-commands.md` | modified | +1 / -1 |
| `test/integration/commands/workflow-command.test.ts` | modified | +12 / -0 |
| `test/unit/core/tasks/transition-hint.test.ts` | added | - |
| `test/unit/core/verification/input-hint.test.ts` | added | - |
| `test/unit/core/workflow/baseline-status.test.ts` | added | - |
| `test/unit/core/workflow/check-flag-issues.test.ts` | added | - |
| `test/unit/core/workflow/flag-issues.test.ts` | added | - |
| `test/unit/core/workflow/init-checks-notice.test.ts` | added | - |
| `test/unit/core/workflow/init-issues.test.ts` | added | - |
| `test/unit/core/workflow/init-spec.test.ts` | modified | +13 / -0 |
| `test/unit/core/workflow/init-task.test.ts` | modified | +1 / -1 |
| `test/unit/core/workflow/secret-scan-changes.test.ts` | added | - |

_(4 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): Khi --init hoặc --set-check thiếu hoặc sai nhiều flag (slug, command, scope, description, criteria, input), một lần gọi trả một lỗi liệt kê đủ mọi flag còn thiếu hoặc sai và một lệnh mẫu đã sửa.
- [x] `ac-2` (met): Khi title có ký tự ngoài ASCII và thiếu --slug, lỗi nêu slug tiếng Anh gợi ý sinh từ title; --scope sai giá trị (ví dụ project) nêu rõ chỉ nhận focused hoặc full.
- [x] `ac-3` (met): Gom validate không làm plan-edit.ts vượt 300 dòng code: logic validate flag tách sang module riêng trong src/core/workflow/; lint max-lines và test kiến trúc vẫn xanh.
- [x] `ac-4` (met): Tài liệu và snapshot đồng bộ: docs/HARNIX_WORKFLOW.md, src/templates/harnix/workflow.md (chạy pnpm selfhost:sync), mô tả --schema và docs/HARNIX_PRD.md nếu bề mặt công khai đổi; behavior-snapshot.golden.json chỉ cập nhật cho đúng chuỗi mới; phiên bản bump 2.29.0-dev.N kèm CHANGELOG trước verifying.
- [x] `ac-5` (met): Khi --init có --cwd, mọi check từ --with-check không khai cwd= kế thừa cwd đó; cwd= khai tường minh vẫn ưu tiên; có test cho cả hai.
- [x] `ac-6` (met): Kết quả --init liệt kê từng check đã tạo (id, scope, command, cwd), ghi rõ check suite tự sinh, và cảnh báo nếu một --with-check có scope full trùng command với check suite tự sinh.

## Required checks

- [x] `chk-focus` (focused): Test tập trung của thay đổi — pass (2026-11-09 11:28:23 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-11-09 11:29:45 +07:00)
- [x] `chk-gates` (focused): Contract test: cli-contract, architecture, docs, golden, instruction budget — pass (2026-11-09 11:28:31 +07:00)

## Evidence

- `chk-focus` — pass (2026-11-09 11:28:23 +07:00): pnpm exec vitest run test/unit/core/workflow test/integration/commands/workflow — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-gates` — pass (2026-11-09 11:28:31 +07:00): pnpm test:gates — exit 0
- `chk-suite` — pass (2026-11-09 11:29:45 +07:00): pnpm test — exit 0
