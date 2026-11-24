# Sinh khung prd và plan cho task Full đang planning, đóng epic bằng bản minor

- **ID:** 20261124-232024-scaffold-docs
- **Mode:** lite
- **Epic:** 20261124-232018-harnix-friction-fixes
- **Status:** planning/planning
- **Created:** 2026-11-24 23:20:24 +07:00
- **Updated:** 2026-11-24 23:21:29 +07:00

**Verdict:** PENDING — 0/4 acceptance criteria met

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 0% | 0/4 met or waived |
| Required checks | 0% | 0/2 passed |

## Goal

Giúp soạn prd.md và plan.md không cần heredoc: sinh khung từ criteria và check đã khai báo hoặc nạp file UTF-8 cho task Full đang planning; member cuối đóng epic.

## Acceptance criteria

- [ ] `ac-1` (pending): `harnix workflow --scaffold-docs [--prd-file <p>] [--plan-file <p>] [--force]` cho task Full đang `planning` (nhận `--task`): không có file thì sinh khung `prd.md` và `plan.md` từ criteria và check hiện tại, không ghi đè nội dung đã có trừ khi `--force`; có file thì nạp UTF-8 nguyên văn (bỏ BOM, qua kiểm mojibake); ghi bằng đường `saveWorkflow`.
- [ ] `ac-2` (pending): Task Lite hoặc task không ở `planning` bị từ chối kèm hint; khung sinh ra không chứa token placeholder cứng làm cổng ready từ chối và có dòng checklist `[chk-id]` cho từng required check.
- [ ] `ac-3` (pending): Hành vi có đủ trong `WORKFLOW_ACTIONS`, `--schema`, flag-owners, handler, test action-checklist, golden (chỉ chuỗi mới), docs (HARNIX_WORKFLOW, PRD) và template `workflow.md` (tối đa một dòng trong ngân sách còn lại, rồi `pnpm selfhost:sync`).
- [ ] `ac-4` (pending): Member cuối đóng epic: `pnpm version:sync 2.40.0 --fold-dev` với một entry CHANGELOG, một lượt harnix-review do reviewer độc lập trên toàn diff epic trước finish, chạy lại toàn bộ check và mọi script exercise; kiểm bằng CLI thật qua `scripts/exercise-scaffold-docs.mjs` (tiếng Việt qua `--prd-file` đúng byte).

## Required checks

- [ ] `check-suite` (full): Toàn bộ test của dự án phải xanh — chưa chạy / not yet run
- [ ] `chk-focused` (focused): Test hợp đồng nhanh (docs, CLI, ngân sách token, nguồn skill) — chưa chạy / not yet run

## Decisions

- **dec-scaffold-full-only** — --scaffold-docs chỉ cho task Full đang planning (Lite không có prd.md và plan.md); member của --init-epic vẫn là Lite.
  - _Why:_ Mở rộng init-epic sang Full là thay đổi riêng, không nằm trong epic này.

## Evidence

_None recorded yet._
