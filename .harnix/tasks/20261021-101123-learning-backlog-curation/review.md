# Gợi ý tự động thăng hạng learning tại --finish và phân loại learning backlog

- **ID:** 20261021-101123-learning-backlog-curation
- **Mode:** lite
- **Epic:** 20261021-101119-review-hardening
- **Status:** completed/finishing
- **Created:** 2026-10-21 10:11:19 +07:00
- **Updated:** 2026-10-21 11:00:20 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 2/2 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Bổ sung cơ chế gợi ý thăng hạng (promotable candidate hint) tự động trong kết quả --finish khi có candidate chín muồi, đồng thời chốt 5 quy tắc bất biến vào learned.md và dọn dẹp draft rác

## Non-goals

- Không sửa đổi cơ chế lưu trữ jsonl của journal

## Relevant paths

- `.harnix/spec/learned.md`
- `src/core/journal/learning-capture.ts`
- `src/core/workflow/finish.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +24 / -0 |
| `README.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/core/workflow/finish.ts` | modified | +33 / -1 |
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
| `src/templates/harnix/activation.ts` | modified | +2 / -2 |
| `src/templates/harnix/agents.ts` | modified | +1 / -1 |
| `src/utils/check-runner.ts` | modified | +19 / -4 |
| `test/unit/core/journal/learned-blocks.test.ts` | modified | +72 / -0 |
| `test/unit/core/workflow/finish.test.ts` | modified | +28 / -30 |
| `test/unit/utils/check-runner.test.ts` | modified | +32 / -33 |
| `test/workflow/legacy-history.test.ts` | modified | +29 / -13 |

## Acceptance criteria

- [x] `ac-1` (met): learned.md được khởi tạo với 5 block chuẩn theo parser learned-blocks, draft rác bị loại bỏ và các test suite learning-review, learning-automation xanh
- [x] `ac-2` (met): Lệnh finish tự động phát hiện và gợi ý lệnh promote 1 chạm khi task hoàn tất tạo ra hoặc tìm thấy candidate đạt chất lượng

## Required checks

- [x] `check-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-10-21 10:59:56 +07:00)
- [x] `check-learning` (focused): Chạy test học hỏi, gợi ý thăng hạng tại finish và quản lý spec learned.md — pass (2026-10-21 10:58:03 +07:00)

## Evidence

- `check-learning` — pass (2026-10-21 10:58:03 +07:00): pnpm exec vitest run test/unit/core/journal/learning-review.test.ts test/unit/core/workflow/finish.test.ts test/workflow/learning-automation.test.ts — exit 0
- `check-suite` — pass (2026-10-21 10:59:56 +07:00): pnpm test — exit 0
