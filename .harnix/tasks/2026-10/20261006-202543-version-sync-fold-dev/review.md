# version:sync gom các bản dev thành một entry phát hành

- **ID:** 20261006-202543-version-sync-fold-dev
- **Mode:** full
- **Epic:** 20261006-202542-harnix-self-improvement
- **Status:** completed/finishing
- **Created:** 2026-10-06 20:25:42 +07:00
- **Updated:** 2026-10-07 10:29:36 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Khi đóng epic, pnpm version:sync X.Y.0 gom các entry X.Y.0-dev.N trong CHANGELOG thành một entry X.Y.0 thay vì để người làm gom tay, và không định dạng lại các file markdown không liên quan.

## Non-goals

- Không nới ngưỡng hay bỏ test cấu trúc
- Không đổi hành vi hiện có ngoài phạm vi tiêu chí

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-1` (met): pnpm version:sync X.Y.0 --fold-dev gộp mọi entry X.Y.0-dev.N thành một entry X.Y.0 giữ nguyên thứ tự và nội dung các mục Added/Changed/Fixed, không mất dòng nào, và chạy lại không đổi gì.
- `ac-2` (met): version:sync chỉ định dạng lại các file nó thực sự ghi và không đụng các file markdown khác; có test chứng minh.
- `ac-3` (met): Tài liệu chính sách phiên bản nêu --fold-dev cho task đóng epic.

## Required checks

- `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-07 10:29:08 +07:00)
- `check-fold` (focused): Test version-sync gộp dev (fold) và chỉ ghi file của chính nó — pass (2026-10-07 10:27:53 +07:00)
- `check-gates` (focused): Contract tests (docs, instruction budget, golden) xanh sau khi sửa tài liệu chính sách — pass (2026-10-07 10:27:57 +07:00)

## Evidence

- `check-fold` — pass (2026-10-07 10:27:53 +07:00): pnpm exec vitest run test/workflow/version-sync.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-gates` — pass (2026-10-07 10:27:57 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-07 10:29:08 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
