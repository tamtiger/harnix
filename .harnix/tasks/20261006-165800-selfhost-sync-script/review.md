# Script đồng bộ file tự-host và hash manifest thay cho thao tác tay

- **ID:** 20261006-165800-selfhost-sync-script
- **Mode:** full
- **Epic:** 20261006-141317-workflow-field-feedback
- **Status:** planning/planning
- **Created:** 2026-10-06 16:58:00 +07:00
- **Updated:** 2026-10-06 16:58:00 +07:00

**Verdict:** PENDING — 0/4 acceptance criteria met

## Goal

Một lệnh duy nhất đồng bộ .harnix/workflow.md với template và cập nhật hash trong .harnix/.template-hashes.json (chuẩn hóa LF), và làm rõ vì sao harnix update bỏ qua workflow.md của chính repo này và kéo theo thay đổi guide không liên quan.

## Non-goals

- Không đổi hành vi harnix update cho repo của người dùng
- Không tự commit

## Acceptance criteria

- `ac-1` (pending): Có script pnpm (ví dụ pnpm selfhost:sync) sinh lại .harnix/workflow.md từ template và ghi hash chuẩn hóa LF cùng generatorVersion vào manifest; chạy lại không đổi gì (idempotent) và có test.
- `ac-2` (pending): Test self-host báo lỗi kèm đúng lệnh sửa (pnpm selfhost:sync) khi file hoặc hash lệch, thay vì chỉ báo hai chuỗi hash khác nhau.
- `ac-3` (pending): Nguyên nhân harnix update bỏ qua .harnix/workflow.md và cập nhật guide common.md ngoài ý muốn được điều tra, ghi vào tài liệu hoặc sửa nếu là lỗi, kèm test hồi quy.
- `ac-4` (pending): AGENTS.md và skill harnix-implement chỉ dẫn dùng script này ở bước release preparation.

## Required checks

- `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — chưa chạy / not yet run

## Evidence

_None recorded yet._
