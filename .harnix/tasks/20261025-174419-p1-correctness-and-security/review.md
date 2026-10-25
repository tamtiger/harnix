# Sửa 8 lỗi P1: replay task đã hoàn tất, mất cập nhật song song, git/glob nguy hiểm, cờ và epic sai, bộ lọc learning

- **ID:** 20261025-174419-p1-correctness-and-security
- **Mode:** full
- **Epic:** 20261025-174418-hardening-and-token-diet
- **Status:** completed/finishing
- **Created:** 2026-10-25 17:44:19 +07:00
- **Updated:** 2026-10-25 19:12:13 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 8/8 met or waived |
| Required checks | 100% | 9/9 passed |

## Goal

Sửa các lỗi P1 đã tái hiện: lưu lại task completed làm kẹt dự án, hai lệnh ghi song song mất dữ liệu, verify-plan chạy chương trình của .git/config, ReDoS trong .harnixignore, --set-paths --file bị từ chối, harnix epic ẩn epic mới nhất, và hai lỗ hổng bộ lọc learning-safety.

## Non-goals

- Không đổi ý định circuit breaker (chờ người dùng chốt, xem plan.md)
- Không refactor cấu trúc action/flag (thuộc task refactor)

## Relevant paths

- `src/core/workflow/save.ts`
- `src/core/workflow/plan-edit.ts`
- `src/core/stack/verify-plan.ts`
- `src/utils/safe-glob.ts`
- `src/commands/workflow-flags.ts`
- `src/commands/epic.ts`
- `src/core/epics/epic.ts`
- `src/core/journal/learning-safety.ts`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +2 / -2 |
| `docs/HARNIX_PRD.md` | modified | +1 / -1 |
| `docs/HARNIX_WORKFLOW.md` | modified | +2 / -0 |
| `package.json` | modified | +1 / -1 |
| `src/commands/epic.ts` | modified | +5 / -2 |
| `src/commands/workflow-command.ts` | modified | +2 / -1 |
| `src/commands/workflow-flags.ts` | modified | +4 / -2 |
| `src/core/journal/learning-safety.ts` | modified | +13 / -3 |
| `src/core/stack/verify-plan.ts` | modified | +4 / -6 |
| `src/core/tasks/read-tracker.ts` | added | - |
| `src/core/tasks/task-store.ts` | modified | +4 / -1 |
| `src/core/workflow/save.ts` | modified | +20 / -0 |
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
| `src/utils/safe-glob.ts` | modified | +73 / -14 |
| `test/integration/commands/epic.test.ts` | modified | +20 / -0 |
| `test/unit/commands/workflow-handlers.test.ts` | modified | +20 / -0 |
| `test/unit/core/journal/learning-safety.test.ts` | modified | +21 / -0 |
| `test/unit/core/stack/verify-plan.test.ts` | modified | +18 / -1 |
| `test/unit/core/tasks/read-tracker.test.ts` | added | - |
| `test/unit/core/workflow/plan-edit.test.ts` | modified | +19 / -1 |
| `test/unit/core/workflow/save.test.ts` | modified | +15 / -0 |
| `test/unit/utils/safe-glob.test.ts` | modified | +17 / -0 |
| `test/workflow/legacy-history.test.ts` | modified | +3 / -1 |

## Acceptance criteria

- [x] `ac-1` (met): --save lại bản ghi của task đã completed hoặc cancelled bị từ chối và không ghi lại con trỏ .active
- [x] `ac-2` (met): Các lệnh ghi flag chạy song song (--add-decision, --add-risk, --set-paths...) không mất cập nhật im lặng: đủ N thay đổi hoặc bị từ chối rõ ràng
- [x] `ac-3` (met): verify-plan --changed gọi git qua đường đọc-chỉ an toàn có timeout và maxBuffer nên không chạy chương trình của core.fsmonitor
- [x] `ac-4` (met): Khớp glob của .harnixignore không còn backtrack theo cấp số mũ: pattern nhiều dấu * với tên 60 ký tự trả về dưới 100ms
- [x] `ac-5` (met): workflow --set-paths --file <payload> được chấp nhận đúng như FLAG_OWNERS và tài liệu mô tả
- [x] `ac-6` (met): harnix epic liệt kê epic mới nhất trước và total là tổng số epic, không phải số phần tử đã cắt
- [x] `ac-7` (met): learning-safety chặn URL có userinfo (user:pass@host) và tham số query dạng khóa bí mật, không cho vào journal, hook context hay learned.md
- [x] `ac-8` (met): learning-safety bắt được câu override có xuống dòng hoặc ký tự định dạng vô hình giữa các từ

## Required checks

- [x] `chk-replay` (focused): Test save lại task đã kết thúc — pass (2026-10-25 19:04:22 +07:00)
- [x] `chk-lock` (focused): Test ghi song song không mất cập nhật — pass (2026-10-25 19:04:31 +07:00)
- [x] `chk-verifyplan` (focused): Test verify-plan --changed dùng git an toàn — pass (2026-10-25 19:04:37 +07:00)
- [x] `chk-glob` (focused): Test glob không backtrack — pass (2026-10-25 19:04:40 +07:00)
- [x] `chk-setpaths` (focused): Test --set-paths --file — pass (2026-10-25 19:04:46 +07:00)
- [x] `chk-epic` (focused): Test danh sách epic mới nhất trước và total đúng — pass (2026-10-25 19:04:52 +07:00)
- [x] `chk-learning` (focused): Test bộ lọc learning-safety — pass (2026-10-25 19:04:55 +07:00)
- [x] `chk-gates` (focused): Các contract test (CLI, docs, golden) — pass (2026-10-25 19:09:57 +07:00)
- [x] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-25 19:12:09 +07:00)

## Evidence

- `chk-replay` — pass (2026-10-25 19:04:22 +07:00): pnpm exec vitest run test/unit/core/workflow/save.test.ts — exit 0
- `chk-lock` — pass (2026-10-25 19:04:31 +07:00): pnpm exec vitest run test/unit/core/workflow/plan-edit.test.ts — exit 0
- `chk-verifyplan` — pass (2026-10-25 19:04:37 +07:00): pnpm exec vitest run test/unit/core/stack/verify-plan.test.ts — exit 0
- `chk-glob` — pass (2026-10-25 19:04:40 +07:00): pnpm exec vitest run test/unit/utils/safe-glob.test.ts — exit 0
- `chk-setpaths` — pass (2026-10-25 19:04:46 +07:00): pnpm exec vitest run test/unit/commands/workflow-handlers.test.ts — exit 0
- `chk-epic` — pass (2026-10-25 19:04:52 +07:00): pnpm exec vitest run test/integration/commands/epic.test.ts test/unit/core/epics/epic.test.ts — exit 0
- `chk-learning` — pass (2026-10-25 19:04:55 +07:00): pnpm exec vitest run test/unit/core/journal/learning-safety.test.ts — exit 0
- `chk-gates` — pass (2026-10-25 19:09:57 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-25 19:12:09 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
