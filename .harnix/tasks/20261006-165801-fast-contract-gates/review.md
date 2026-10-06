# Cổng hợp đồng chạy nhanh và bảo vệ golden khỏi cập nhật nhầm

- **ID:** 20261006-165801-fast-contract-gates
- **Mode:** full
- **Epic:** 20261006-141317-workflow-field-feedback
- **Status:** completed/finishing
- **Created:** 2026-10-06 16:58:00 +07:00
- **Updated:** 2026-10-06 19:43:14 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Phát hiện sớm các test hợp đồng (cấu trúc test, cli-contract, architecture, tài liệu, golden) mà check tập trung hay bỏ sót, và chặn việc regenerate golden ghi nhầm lỗi.

## Non-goals

- Không nới ngưỡng hay bỏ test cấu trúc
- Không đổi nội dung golden hiện có

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-1` (met): Có script pnpm test:gates chạy trong vài giây các test hợp đồng: test-structure, cli-contract, architecture, docs-task-contract, skill-sources, instruction-budget và behavior-snapshot.
- `ac-2` (met): harnix verify-plan hoặc hướng dẫn lập kế hoạch nêu test:gates như check tập trung gợi ý cho mọi task đổi CLI, tài liệu hoặc cấu trúc test.
- `ac-3` (met): HARNIX_UPDATE_GOLDEN từ chối ghi khi kịch bản golden sinh thêm trường error mới so với golden hiện tại và in danh sách đường dẫn thay đổi để người duyệt thấy.
- `ac-4` (met): Có script pnpm test:failures chạy toàn bộ suite bằng reporter JSON và chỉ in tên test lỗi cùng thông điệp ngắn.

## Required checks

- `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-06 19:43:12 +07:00)
- `check-gates` (focused): Guard golden và script test:gates — pass (2026-10-06 19:41:57 +07:00)
- `check-failures` (focused): Script test:failures — pass (2026-10-06 19:42:00 +07:00)
- `check-docs` (focused): test:gates trong hướng dẫn kế hoạch — pass (2026-10-06 19:42:05 +07:00)

## Evidence

- `check-gates` — pass (2026-10-06 19:41:57 +07:00): pnpm exec vitest run test/workflow/behavior-snapshot.test.ts test/workflow/package-contract.test.ts — exit 0
- `check-failures` — pass (2026-10-06 19:42:00 +07:00): pnpm exec vitest run test/workflow/test-failures.test.ts — exit 0
- `check-docs` — pass (2026-10-06 19:42:05 +07:00): pnpm exec vitest run test/workflow/docs-task-contract.test.ts — exit 0
- `check-suite` — pass (2026-10-06 19:43:12 +07:00): pnpm test — exit 0
