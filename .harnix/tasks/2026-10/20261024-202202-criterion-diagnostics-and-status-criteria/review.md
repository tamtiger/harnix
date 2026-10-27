# Cải tiến Chẩn đoán Lỗi Criterion Coverage, Lệnh harnix status --criteria và Tối ưu CLI Ergonomics

- **ID:** 20261024-202202-criterion-diagnostics-and-status-criteria
- **Mode:** lite
- **Epic:** 20261024-202200-harnix-dx-workflow-improvements
- **Status:** completed/finishing
- **Created:** 2026-10-24 21:24:00 +07:00
- **Updated:** 2026-10-24 21:44:57 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 5/5 met or waived |
| Required checks | 100% | 4/4 passed |

## Goal

Giải quyết Vấn đề 2, 5 & các cọ xát thực tế khi phát triển: (1) Nâng cấp thông báo lỗi criterion coverage trong --init và validation để chỉ rõ check id, criterion id chưa phủ và gợi ý cú pháp lệnh khắc phục; (2) Thêm cờ --criteria cho lệnh harnix status để in danh sách tóm tắt id, trạng thái và nội dung tiêu chí lean-token; (3) Khắc phục lỗi false positive của launcherFailure trong check-output.ts khi output chứa kết quả chạy test con; (4) Tự động sort và deduplicate inputs/criteria trong init và validation transports.

## Non-goals

- Không thay đổi định dạng TaskRecord JSON mặc định
- Không làm suy giảm hiệu năng lệnh status

## Relevant paths

- `src/core/tasks/task-validate-contracts.ts`
- `src/commands/status.ts`
- `src/core/workflow/check-output.ts`
- `test/unit/core/tasks/task-validate-contracts.test.ts`
- `test/unit/commands/status.test.ts`
- `test/unit/core/workflow/check-output.test.ts`

## Relevant specs

- `docs/HARNIX_WORKFLOW.md`
- `docs/IMPLEMENTATION_PLAN.md`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +12 / -0 |
| `README.md` | modified | +2 / -1 |
| `docs/HARNIX_PRD.md` | modified | +4 / -1 |
| `docs/HARNIX_WORKFLOW.md` | modified | +1 / -1 |
| `docs/IMPLEMENTATION_PLAN.md` | modified | +5 / -2 |
| `package.json` | modified | +1 / -1 |
| `src/cli-workflow-commands.ts` | modified | +16 / -2 |
| `src/commands/status.ts` | modified | +42 / -0 |
| `src/core/tasks/task-validate-contracts.ts` | modified | +21 / -5 |
| `src/core/workflow/check-output.ts` | modified | +7 / -1 |
| `src/core/workflow/init-task.ts` | modified | +5 / -4 |
| `src/core/workflow/obligations.ts` | modified | +50 / -25 |
| `src/core/workflow/replace-check.ts` | modified | +8 / -2 |
| `src/core/workflow/set-criterion.ts` | modified | +1 / -1 |
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
| `test/unit/commands/status.test.ts` | modified | +27 / -1 |
| `test/unit/core/tasks/task-validate-contracts.test.ts` | modified | +24 / -0 |
| `test/unit/core/workflow/check-output.test.ts` | modified | +1 / -0 |
| `test/unit/core/workflow/obligations.test.ts` | modified | +51 / -59 |
| `test/unit/core/workflow/replace-check.test.ts` | modified | +12 / -3 |
| `test/unit/core/workflow/set-criterion.test.ts` | modified | +11 / -5 |
| `test/workflow/cli-contract.test.ts` | modified | +7 / -1 |
| `test/workflow/task-contract-v3.test.ts` | modified | +18 / -4 |

## Acceptance criteria

- [x] `ac-1` (met): Khi assertCheckCriteria hoặc assertCriterionCoverage phát hiện lỗi coverage (thiếu valid ID, chưa sort, hoặc criterion chưa có check bắt buộc phủ), thông báo lỗi chỉ rõ danh tính check/criterion và gợi ý cú pháp khắc phục cụ thể (--with-check hoặc workflow --set-check).
- [x] `ac-2` (met): Lệnh harnix status --criteria in danh sách ngắn gọn các tiêu chí của task hiện tại theo định dạng '- <id> [<status>]: <text>' giúp đọc nhanh mà không phải in toàn bộ task.
- [x] `ac-3` (met): Khắc phục false positive của launcherFailure trong check-output.ts: không coi là launcher error khi output có vitest runner banner hoặc output dài là kết quả chạy test.
- [x] `ac-4` (met): Tự động chuẩn hóa (sort theo code units và deduplicate) các mảng inputs và criterionIds khi nhận qua --init, --with-check hoặc plan edit thay vì quăng lỗi gây gián đoạn workflow.
- [x] `ac-5` (met): Toàn bộ các bài kiểm thử unit tests và contract gates liên quan tiếp tục pass 100%.

## Required checks

- [x] `chk-unit-task-validate` (focused): Kiểm thử thông báo lỗi chi tiết của task validation và auto-sort — pass (2026-10-24 21:41:53 +07:00)
- [x] `chk-unit-status` (focused): Kiểm thử cờ --criteria trong lệnh status — pass (2026-10-24 21:42:02 +07:00)
- [x] `chk-unit-check-output` (focused): Kiểm thử launcherFailure không bị false positive khi chạy test suite — pass (2026-10-24 21:32:31 +07:00)
- [x] `check-suite` (full): Toàn bộ test suite bảo đảm không hồi quy — pass (2026-10-24 21:44:30 +07:00)

## Evidence

- `chk-unit-task-validate` — pass (2026-10-24 21:41:53 +07:00): pnpm vitest run test/unit/core/tasks/task-validate-contracts.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-unit-status` — pass (2026-10-24 21:42:02 +07:00): pnpm vitest run test/unit/commands/status.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-unit-check-output` — pass (2026-10-24 21:32:31 +07:00): pnpm vitest run test/unit/core/workflow/check-output.test.ts — exit 0
- `check-suite` — pass (2026-10-24 21:44:30 +07:00): pnpm test — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
