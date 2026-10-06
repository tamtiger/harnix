# Cảnh báo khi CLI harnix cũ hơn dự án và đóng epic bằng bản 2.2.0

- **ID:** 20261006-165805-cli-version-skew-warning
- **Mode:** full
- **Epic:** 20261006-141317-workflow-field-feedback
- **Status:** planning/planning
- **Created:** 2026-10-06 16:58:00 +07:00
- **Updated:** 2026-10-06 16:58:00 +07:00

**Verdict:** PENDING — 0/4 acceptance criteria met

## Goal

Báo rõ khi harnix chạy trên PATH cũ hơn phiên bản đã ghi trong dự án, vì khi đó các cổng mới không có tác dụng mà không có dấu hiệu nào; đồng thời task cuối này phát hành bản 2.2.0 đóng epic.

## Non-goals

- Không chặn lệnh khi lệch phiên bản
- Không gọi mạng để kiểm tra phiên bản

## Acceptance criteria

- `ac-1` (pending): harnix workflow --preflight và harnix doctor có trường hoặc cảnh báo skew khi generatorVersion trong .harnix/.template-hashes.json lớn hơn phiên bản CLI đang chạy, nêu cả hai phiên bản và cách cập nhật; không có cảnh báo khi bằng nhau hoặc CLI mới hơn.
- `ac-2` (pending): Cảnh báo ngắn, không làm preflight dài thêm khi không lệch, và có test cho ba trường hợp (CLI cũ hơn, bằng nhau, mới hơn kể cả tiền phát hành).
- `ac-3` (pending): Tài liệu nêu cách xử lý khi CLI trên PATH cũ hơn repo (build và cài lại bản repo, chỉ khi người dùng cho phép).
- `ac-4` (pending): Task đóng epic: pnpm version:sync 2.2.0 với CHANGELOG gom các bản dev, đồng bộ file tự-host, và toàn bộ gate pass.

## Required checks

- `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — chưa chạy / not yet run

## Evidence

_None recorded yet._
