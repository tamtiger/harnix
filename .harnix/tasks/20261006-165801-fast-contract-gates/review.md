# Cổng hợp đồng chạy nhanh và bảo vệ golden khỏi cập nhật nhầm

- **ID:** 20261006-165801-fast-contract-gates
- **Mode:** full
- **Epic:** 20261006-141317-workflow-field-feedback
- **Status:** planning/planning
- **Created:** 2026-10-06 16:58:00 +07:00
- **Updated:** 2026-10-06 16:58:00 +07:00

**Verdict:** PENDING — 0/4 acceptance criteria met

## Goal

Phát hiện sớm các test hợp đồng (cấu trúc test, cli-contract, architecture, tài liệu, golden) mà check tập trung hay bỏ sót, và chặn việc regenerate golden ghi nhầm lỗi.

## Non-goals

- Không nới ngưỡng hay bỏ test cấu trúc
- Không đổi nội dung golden hiện có

## Acceptance criteria

- `ac-1` (pending): Có script pnpm test:gates chạy trong vài giây các test hợp đồng: test-structure, cli-contract, architecture, docs-task-contract, skill-sources, instruction-budget và behavior-snapshot.
- `ac-2` (pending): harnix verify-plan hoặc hướng dẫn lập kế hoạch nêu test:gates như check tập trung gợi ý cho mọi task đổi CLI, tài liệu hoặc cấu trúc test.
- `ac-3` (pending): HARNIX_UPDATE_GOLDEN từ chối ghi khi kịch bản golden sinh thêm trường error mới so với golden hiện tại và in danh sách đường dẫn thay đổi để người duyệt thấy.
- `ac-4` (pending): Có script pnpm test:failures chạy toàn bộ suite bằng reporter JSON và chỉ in tên test lỗi cùng thông điệp ngắn.

## Required checks

- `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — chưa chạy / not yet run

## Evidence

_None recorded yet._
