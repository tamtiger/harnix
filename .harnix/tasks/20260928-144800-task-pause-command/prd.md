# PRD — Bổ sung lệnh harnix pause để tạm hoãn active task an toàn

## Problem Statement

Hiện tại Harnix áp dụng nghiêm ngặt quy tắc Invariant 1: duy nhất một active task tại một thời điểm, lưu con trỏ tại `.harnix/tasks/.active`. Ngoài ra, agent có chỉ dẫn cấm sửa trực tiếp file `.active` ("Never edit task.json or .active directly").
Mặc dù Harnix đã có lệnh `harnix resume <task-id>` để kích hoạt lại một task chưa hoàn thành khi con trỏ `.active` trống, hệ thống lại thiếu lệnh đối ứng là `harnix pause` để gỡ con trỏ `.active` một cách an toàn. Khi người dùng muốn tạm hoãn task hiện tại để làm một task mới khác, agent không có công cụ hợp lệ để pause task và bị kẹt.

## Goals

Cung cấp lệnh `harnix pause [--dry-run]` chuẩn hóa trong CLI, giúp người dùng và agent dễ dàng gỡ active pointer một cách an toàn, có thông điệp hướng dẫn rõ ràng, và cập nhật skills để agent biết tự động dùng lệnh này.

## Acceptance Criteria

### AC `ac-pause-core-logic`
**Verifies:** `check-unit-tests`
Module `task-pause.ts` xử lý logic xóa con trỏ active pointer một cách atomic, hỗ trợ dryRun, kiểm tra trạng thái active task và fail closed nếu task không hợp lệ.

### AC `ac-cli-pause-command`
**Verifies:** `check-integration-tests`
CLI hỗ trợ lệnh `harnix pause [--dry-run]` trả về JSON schema chuẩn, với outcome `paused`, `would-pause` hoặc `no-active-task`.

### AC `ac-skills-and-docs`
**Verifies:** `check-skills-and-docs`
Cập nhật tài liệu (`docs/HARNIX_WORKFLOW.md`, `docs/HARNIX_PRD.md`) và các skills (`harnix-brainstorm`, `harnix-continue`) để hướng dẫn agent sử dụng `harnix pause` khi người dùng muốn tạm hoãn task.

### AC `ac-tests-and-verification`
**Verifies:** `check-full-verification`
Đầy đủ unit tests và integration tests cho lệnh `harnix pause`, toàn bộ test suite pass sạch.
