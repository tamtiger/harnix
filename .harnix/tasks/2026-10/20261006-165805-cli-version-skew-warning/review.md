# Cảnh báo khi CLI harnix cũ hơn dự án và đóng epic bằng bản 2.2.0

- **ID:** 20261006-165805-cli-version-skew-warning
- **Mode:** full
- **Epic:** 20261006-141317-workflow-field-feedback
- **Status:** completed/finishing
- **Created:** 2026-10-06 16:58:00 +07:00
- **Updated:** 2026-10-06 20:32:21 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Báo rõ khi harnix chạy trên PATH cũ hơn phiên bản đã ghi trong dự án, vì khi đó các cổng mới không có tác dụng mà không có dấu hiệu nào; đồng thời task cuối này phát hành bản 2.2.0 đóng epic.

## Non-goals

- Không chặn lệnh khi lệch phiên bản
- Không gọi mạng để kiểm tra phiên bản

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-1` (met): harnix workflow --preflight và harnix doctor có trường hoặc cảnh báo skew khi generatorVersion trong .harnix/.template-hashes.json lớn hơn phiên bản CLI đang chạy, nêu cả hai phiên bản và cách cập nhật; không có cảnh báo khi bằng nhau hoặc CLI mới hơn.
- `ac-2` (met): Cảnh báo ngắn, không làm preflight dài thêm khi không lệch, và có test cho ba trường hợp (CLI cũ hơn, bằng nhau, mới hơn kể cả tiền phát hành).
- `ac-3` (met): Tài liệu nêu cách xử lý khi CLI trên PATH cũ hơn repo (build và cài lại bản repo, chỉ khi người dùng cho phép).
- `ac-4` (met): Task đóng epic: pnpm version:sync 2.2.0 với CHANGELOG gom các bản dev, đồng bộ file tự-host, và toàn bộ gate pass.

## Required checks

- `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-06 20:32:19 +07:00)
- `check-skew` (focused): Phát hiện skew phiên bản trong preflight và doctor — pass (2026-10-06 20:31:08 +07:00)
- `check-docs` (focused): Tài liệu skew và CHANGELOG 2.2.0 — pass (2026-10-06 20:31:12 +07:00)

## Evidence

- `check-skew` — pass (2026-10-06 20:31:08 +07:00): pnpm exec vitest run test/unit/core/versions/skew.test.ts test/unit/core/workflow/preflight.test.ts test/unit/core/doctor/project.test.ts — exit 0
- `check-docs` — pass (2026-10-06 20:31:12 +07:00): pnpm exec vitest run test/workflow/docs-task-contract.test.ts — exit 0
- `check-suite` — pass (2026-10-06 20:32:19 +07:00): pnpm test — exit 0
