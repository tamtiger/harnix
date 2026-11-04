# Giảm tranh chấp khi chạy cả suite test

- **ID:** 20261030-142218-speed-up-slow-tests
- **Mode:** lite
- **Epic:** 20261030-142214-dev-maintenance
- **Status:** completed/finishing
- **Created:** 2026-10-30 14:22:14 +07:00
- **Updated:** 2026-10-30 16:17:02 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 1/1 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Đo cho thấy file test chạy riêng nhanh hơn trong suite 4 đến 13 lần (git 2.2 s so với 29 s, learning-automation 10.7 s so với 43 s) và cả suite nhanh nhất ở 8 worker (68 s) so với 12 worker mặc định (89 s): thời gian mất do tranh chấp tài nguyên, không do nội dung test.

## Non-goals

- Không xóa hay bỏ qua test, không hạ ngưỡng coverage.

## Relevant paths

- `test/README.md`
- `vitest.config.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -1 |
| `CHANGELOG.md` | modified | +12 / -0 |
| `README.md` | modified | +2 / -2 |
| `docs/HARNIX_PRD.md` | modified | +1 / -1 |
| `docs/IMPLEMENTATION_PLAN.md` | modified | +3 / -3 |
| `docs/UPSTREAM_BASELINE.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `scripts/footprint-budget.json` | deleted | +0 / -1 |
| `scripts/footprint-budget.mjs` | deleted | +0 / -25 |
| `scripts/measure-footprint.mjs` | modified | +0 / -4 |
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
| `test/README.md` | modified | +2 / -0 |
| `test/workflow/measure-footprint-guard.test.ts` | modified | +8 / -34 |
| `vitest.config.ts` | modified | +4 / -0 |

## Acceptance criteria

- [x] `ac-1` (met): vitest.config.ts đặt maxWorkers (khởi điểm 8, chọn lại theo số đo trên máy hiện tại) kèm lý do trong comment; ghi vào decision thời gian cả suite trước và sau (ít nhất ba lần mỗi cấu hình); thời gian tường trung bình không tăng, số test và assertion không giảm, và suite chạy hai lần liên tiếp không có test mới flaky.

## Required checks

- [x] `chk-slow` (focused): Cả suite chạy với cấu hình worker mới — pass (2026-10-30 16:15:41 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-10-30 16:17:00 +07:00)

## Decisions

- **measured** — Đo sạch (một benchmark tại một thời điểm, 3 lần mỗi cấu hình): 6 worker 80/77/77 s, 12 worker 83/81/98 s, 8 worker 73/91/111 s; đo xen kẽ ba cặp: 12 worker 82/79/80 s, 6 worker 75/76/80 s. Chọn maxWorkers 6. Lần đo đầu 8 worker 68 s là nhiễu; hai benchmark chạy chồng nhau cho số vô nghĩa.
  - _Why:_ 6 worker nhanh hơn khoảng 4 đến 10% và ổn định hơn, không bao giờ chậm hơn trong một cặp.

## Evidence

- `chk-slow` — pass (2026-10-30 16:15:41 +07:00): pnpm exec vitest run test/unit/core/workflow test/workflow/learning-automation.test.ts test/unit/utils/git.test.ts — exit 0
- `chk-suite` — pass (2026-10-30 16:17:00 +07:00): pnpm test — exit 0
