# Sửa archive: epic không có tháng trong ID và khoảng hở plan/apply

- **ID:** 20261028-103408-archive-epic-month-guard
- **Mode:** lite
- **Status:** completed/finishing
- **Created:** 2026-10-28 10:34:08 +07:00
- **Updated:** 2026-10-28 10:40:03 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 2/2 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Epic có ID không mang tháng không được để lại trạng thái archive dở dang; apply phải lập lại kế hoạch trong khóa để không chuyển epic vừa có thành viên mới.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/commands/archive.ts` | modified | +3 / -1 |
| `src/core/tasks/archive.ts` | modified | +12 / -4 |
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
| `test/unit/core/tasks/archive.test.ts` | modified | +32 / -0 |
| `test/workflow/legacy-history.test.ts` | modified | +1 / -1 |

## Acceptance criteria

- [x] `ac-1` (met): Epic có ID không bắt đầu bằng tháng hợp lệ bị bỏ qua với lý do skip riêng trước khi bất kỳ thành viên nào được chuyển; lần chạy lại không báo lỗi và không có task nào bị archive dở dang.
- [x] `ac-2` (met): applyArchive lập lại kế hoạch bên trong khóa workflow: epic vừa nhận thêm thành viên chưa kết thúc hoặc task tiếp nối mở sau lúc lập kế hoạch thì bị bỏ qua, không bị chuyển vào kho.

## Required checks

- [x] `check-1` (focused): Kiểm chứng: Sửa archive: epic không có tháng trong ID và khoảng hở plan/apply — pass (2026-10-28 10:35:50 +07:00)
- [x] `check-suite` (full): Toàn bộ suite kiểm thử của dự án — pass (2026-10-28 10:39:54 +07:00)

## Evidence

- `check-1` — pass (2026-10-28 10:35:50 +07:00): pnpm exec vitest run test/unit/core/tasks/archive.test.ts test/integration/commands/archive.test.ts — exit 0
- `check-suite` — pass (2026-10-28 10:39:54 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
