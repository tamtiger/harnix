# Thu hẹp phạm vi secret scan, nâng cao chất lượng learning note và quy trình planning

- **ID:** 20261015-213329-refine-secret-scan-and-planning-process
- **Mode:** full
- **Epic:** 20261015-213325-harnix-dx-workflow-friction-reduction
- **Status:** completed/finishing
- **Created:** 2026-10-15 21:33:25 +07:00
- **Updated:** 2026-10-16 00:14:05 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Giới hạn secret scan vào các file thay đổi thực tế của task, hỗ trợ allowlist/waiver cho false-positive, bỏ hint gây nhiễu No learning captured, kiểm tra sanity check test files khi resume và hoàn thiện tài liệu skill harnix-plan.

## Relevant paths

- `src/core/workflow/secret-scan.ts`
- `src/core/workflow/finish.ts`
- `src/skills/harnix-plan/SKILL.md`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- [x] `ac-1` (met): scanTaskSecrets chỉ quét các file thực sự thay đổi hoặc được khai báo trong task, hỗ trợ allowlist/waiver có lý do cho các file test mock.
- [x] `ac-2` (met): Cơ chế trích xuất learning phân biệt được quyết định cục bộ và bài học kinh nghiệm có điều kiện áp dụng; loại bỏ hint gây nhiễu No learning captured khi không có gì cần ghi.
- [x] `ac-3` (met): Quy trình Epic cho phép member tasks giữ tiêu chí/check ở dạng draft; tự động sanity-check các test file được trỏ tới khi resume để cảnh báo file đã bị task trước xóa.
- [x] `ac-4` (met): Tài liệu skill harnix-plan hướng dẫn đối chiếu finding với code thực tế trước khi đóng băng tiêu chí.

## Required checks

- [x] `check-gates` (focused): Chạy verification gates — pass (2026-10-16 00:12:08 +07:00)
- [x] `check-suite` (full): Chạy toàn bộ test suite của Harnix — pass (2026-10-16 00:13:29 +07:00)

## Evidence

- `check-gates` — pass (2026-10-16 00:12:08 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-16 00:13:29 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
