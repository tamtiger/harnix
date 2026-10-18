# Bổ sung ngữ cảnh Git chỉ đọc vào Preflight và chuẩn hóa quy trình Branching Stash

- **ID:** 20261018-175355-read-only-git-context-and-flow
- **Mode:** full
- **Epic:** 20261018-175353-dx-robustness-and-php-resilience
- **Status:** completed/finishing
- **Created:** 2026-10-18 17:53:55 +07:00
- **Updated:** 2026-10-18 20:25:07 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Bổ sung trường git chỉ đọc (branch, clean, commit) vào kết quả status/preflight; cập nhật tài liệu hướng dẫn về xác định base branch, target branch, xử lý divergence và quy trình Stash & Switch khi chuyển task.

## Non-goals

- Không tự động commit, tạo nhánh hay checkout Git.
- Không làm chậm tốc độ preflight khi không ở trong git repository.

## Relevant paths

- `src/core/workflow/preflight.ts`
- `src/core/status.ts`
- `docs/HARNIX_WORKFLOW.md`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- [x] `ac-1` (met): Harnix status/preflight trả về thông tin Git read-only một cách an toàn, không làm crash khi chạy trong môi trường không có Git.
- [x] `ac-2` (met): Tài liệu hướng dẫn branching strategy, xử lý lệch nhánh (divergence) và quy trình pause/stash/switch task được bổ sung đầy đủ.
- [x] `ac-3` (met): Toàn bộ test gates pass 100%.

## Required checks

- [x] `check-preflight-git` (focused): Kiểm tra preflight với thông tin Git read-only — pass (2026-10-18 20:20:54 +07:00)
- [x] `check-suite` (full): Toàn bộ test suite của dự án pass — pass (2026-10-18 20:24:36 +07:00)
- [x] `check-gates` (focused): Kiểm tra test gates kiến trúc và contract — pass (2026-10-18 20:21:04 +07:00)

## Evidence

- `check-preflight-git` — pass (2026-10-18 20:20:54 +07:00): pnpm test:unit test/unit/core/workflow/preflight.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-gates` — pass (2026-10-18 20:21:04 +07:00): pnpm test:gates — exit 0
- `check-suite` — pass (2026-10-18 20:24:36 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
