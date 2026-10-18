# Xóa bỏ mâu thuẫn Rule 9 và chuẩn hóa nạp payload UTF-8 không phụ thuộc pipe

- **ID:** 20261018-175353-encoding-zero-pipe-and-base64
- **Mode:** full
- **Epic:** 20261018-175353-dx-robustness-and-php-resilience
- **Status:** completed/finishing
- **Created:** 2026-10-18 17:53:53 +07:00
- **Updated:** 2026-10-18 19:19:24 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Cập nhật AGENTS.md và activation.ts tháo gỡ mâu thuẫn Rule 9 (cho phép tạo file payload tạm trong .harnix/); xóa bỏ toàn bộ code mẫu pipe trên Windows trong workflow.md và HARNIX_WORKFLOW.md; bảo đảm lệnh --save --file hoạt động ổn định.

## Non-goals

- Không bổ sung cờ --payload-base64 do giới hạn độ dài dòng lệnh trên Windows.
- Không nới lỏng cơ chế text-integrity.

## Relevant paths

- `AGENTS.md`
- `src/templates/harnix/activation.ts`
- `src/templates/harnix/workflow.md`
- `docs/HARNIX_WORKFLOW.md`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- [x] `ac-1` (met): Rule 9 trong AGENTS.md và activation.ts được điều chỉnh: làm rõ quyền tạo file payload trong .harnix/ cho --file, xóa bỏ mâu thuẫn cấm tạo file tạm.
- [x] `ac-2` (met): Tài liệu src/templates/harnix/workflow.md và docs/HARNIX_WORKFLOW.md loại bỏ hoàn toàn code mẫu dùng pipe  | harnix trên Windows.
- [x] `ac-3` (met): Toàn bộ test gates (contract, architecture, docs) pass 100%.

## Required checks

- [x] `check-docs-gates` (focused): Kiểm tra các test gates về tài liệu, rules và architecture — pass (2026-10-18 19:13:25 +07:00)
- [x] `check-suite` (full): Toàn bộ test suite của dự án pass — pass (2026-10-18 19:18:59 +07:00)

## Evidence

- skipped (2026-10-18 18:54:07 +07:00): Task contract revised at persisted replan: Tinh chỉnh lại Task 1: Bỏ cờ payload-base64 để tránh giới hạn tham số Windows CLI, tập trung giải quyết tận gốc mâu thuẫn Rule 9 và chuẩn hóa nạp file payload an toàn.
- `check-docs-gates` — pass (2026-10-18 19:13:25 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-18 19:18:59 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
