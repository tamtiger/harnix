# PRD: Tối ưu token của một phiên làm việc

## Context & Problem Statement

Baseline đo bằng `pnpm measure:tokens` lúc bắt đầu task (2026-10-25, bản 2.22.0-dev.3): một phiên Lite điển hình (`sessionLite` = always-loaded 1.457 + `workflow.md` 2.435 + `--schema` 2.491 + skill `harnix-plan` 2.105 + `harnix-implement` 1.883 + preflight planning 324 + hook context planning 393) tốn 11.088 token. Khối `transports` của `--schema` chiếm khoảng 1.640 token và lặp lại cookbook; reference `cookbook-commands` chép lại gần hết cookbook của `workflow.md`; `harnix-plan/SKILL.md` sát trần 2.000.

## Scope & Boundaries

Trong phạm vi: `--schema` mặc định gọn và `--schema --full`; bỏ lặp cookbook; `harnix-plan/SKILL.md` ≤ 1.800 token với trần test hạ xuống 1.800; trường `sessionLite` trong `measure:tokens`. Ngoài phạm vi: đổi field hay enum đóng băng, làm yếu gate hay bỏ nội dung bắt buộc của skill.

## Anchored Acceptance Criteria

- ac-1: `--schema` mặc định không in `transports`, `--schema --full` in đủ, tiết kiệm ≥ 1.200 token.
- ac-2: cookbook không còn lặp, tổng giảm ≥ 400 token.
- ac-3: mỗi SKILL.md ≤ 1.800 token, nội dung bắt buộc vẫn có test bảo vệ.
- ac-4: `sessionLite` giảm ≥ 1.800 token so với baseline 11.088.

## Architectural & Safety Constraints

Nội dung bị cắt khỏi sheet vẫn nằm ở reference hoặc `--schema --full`; các test bảo vệ nội dung tìm trong cả sheet lẫn reference. Tuân thủ AGENTS.md và .harnix/spec/guides/.

Ghi chú quy trình: phần code của task này được viết khi task còn ở `planning` (vi phạm thứ tự "persist `in_progress/implementing` trước lần sửa đầu tiên"); trạng thái được bổ sung ngay sau khi phát hiện và đã báo người dùng.
