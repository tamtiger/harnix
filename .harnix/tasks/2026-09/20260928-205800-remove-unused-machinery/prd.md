# PRD — Gỡ code chết và gộp checks/audit vào status --explain

## Problem Statement

Audit (`research/inventory.md`, `research/usage-evidence.md`) cho thấy nhiều module không có caller và ba lệnh debug giá trị thấp trên bề mặt public. Cần gỡ code chết và giảm bề mặt CLI mà không mất khả năng đọc dữ liệu cũ.

## Goals

Gỡ dead-code có bằng chứng, gộp `checks`/`audit` vào `status --explain`, giữ tương thích dữ liệu cũ, đồng bộ docs. Phần gỡ context-selection chuyển sang `simplify-task-contract`.

## Acceptance Criteria

### AC `ac-removed`
**Verifies:** `check-suite`
Các module không caller (`src/migration/**`, `src/rules/rules.ts`, `src/templates/harnix/managed-workflow.ts`, `src/core/research.ts`) và test mồ côi bị gỡ; typecheck/lint/test xanh.

### AC `ac-status-explain`
**Verifies:** `check-suite`
`harnix status --explain` trả `explain.checks` và `explain.audit`, giữ redaction chống lộ nội dung task hỏng.

### AC `ac-cli-breaking`
**Verifies:** `check-suite`
Hai lệnh `checks`/`audit` bị gỡ khỏi CLI; `cli-contract.test` cập nhật còn 15 lệnh.

### AC `ac-compat`
**Verifies:** `check-legacy-compat`
Task v1/v2 lịch sử và task có `context.json` vẫn đọc được.

### AC `ac-migration-suite`
**Verifies:** `check-legacy-compat`
Suite `test:migration` không rỗng: chuyển thành suite tương thích dữ liệu cũ.

### AC `ac-docs-sync`
**Verifies:** `check-docs-sync`
PRD/WORKFLOW/IMPLEMENTATION_PLAN/README không còn mô tả `checks`/`audit` là lệnh riêng; CHANGELOG ghi breaking change.
