# Chính sách phiên bản: bản dev cho từng member, một bản minor khi đóng epic, patch cho task lẻ

- **ID:** 20261006-144106-release-versioning-policy
- **Mode:** full
- **Epic:** 20261006-141317-workflow-field-feedback
- **Status:** completed/finishing
- **Created:** 2026-10-06 14:41:30 +07:00
- **Updated:** 2026-10-06 19:35:02 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Đặt quy tắc phiên bản rõ ràng và kiểm tra được: task lẻ tăng patch một lần; task thuộc epic dùng bản tiền phát hành X.Y.0-dev.N; khi đóng epic phát hành một bản minor X.(Y+1).0 (major chỉ khi phá vỡ frozen contract).

## Non-goals

- Không đổi lịch sử phiên bản đã phát hành
- Không tự động commit, tag hay publish

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-1` (met): AGENTS.md, workflow.md và skill harnix-implement mô tả chính sách phiên bản: task lẻ patch, member của epic X.Y.0-dev.N, đóng epic minor, major chỉ cho thay đổi phá vỡ frozen contract; ghi rõ ai bump và bump lúc nào.
- `ac-2` (met): scripts/version-sync.mjs chấp nhận X.Y.0-dev.N, từ chối bản dev thấp hơn bản hiện tại hoặc lùi về bản dev của bản đã phát hành, và cho phép bản phát hành X.Y.0 sau chuỗi dev.N; có test cho từng trường hợp.
- `ac-3` (met): Epic 20261006-141317-workflow-field-feedback có quyết định ghi lại: Task 1 đã phát hành 2.1.2, các member còn lại dùng 2.2.0-dev.N và Task 13 (cli-version-skew-warning, member cuối theo ID) đóng epic bằng bản 2.2.0.

## Required checks

- `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-06 19:34:59 +07:00)
- `check-version-rules` (focused): version-sync áp quy tắc dev.N — pass (2026-10-06 19:33:43 +07:00)
- `check-docs` (focused): Chính sách phiên bản trong tài liệu và bản ghi epic — pass (2026-10-06 19:33:48 +07:00)

## Evidence

- `check-version-rules` — pass (2026-10-06 19:33:43 +07:00): pnpm exec vitest run test/workflow/version-sync.test.ts — exit 0
- `check-docs` — pass (2026-10-06 19:33:48 +07:00): pnpm exec vitest run test/workflow/docs-task-contract.test.ts — exit 0
- `check-suite` — pass (2026-10-06 19:34:59 +07:00): pnpm test — exit 0
