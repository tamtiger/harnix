# version:sync gom các bản dev thành một entry phát hành

- **ID:** 20261006-202543-version-sync-fold-dev
- **Mode:** full
- **Epic:** 20261006-202542-harnix-self-improvement
- **Status:** planning/planning
- **Created:** 2026-10-06 20:25:42 +07:00
- **Updated:** 2026-10-06 20:25:42 +07:00

**Verdict:** PENDING — 0/3 acceptance criteria met

## Goal

Khi đóng epic, pnpm version:sync X.Y.0 gom các entry X.Y.0-dev.N trong CHANGELOG thành một entry X.Y.0 thay vì để người làm gom tay, và không định dạng lại các file markdown không liên quan.

## Non-goals

- Không nới ngưỡng hay bỏ test cấu trúc
- Không đổi hành vi hiện có ngoài phạm vi tiêu chí

## Acceptance criteria

- `ac-1` (pending): pnpm version:sync X.Y.0 --fold-dev gộp mọi entry X.Y.0-dev.N thành một entry X.Y.0 giữ nguyên thứ tự và nội dung các mục Added/Changed/Fixed, không mất dòng nào, và chạy lại không đổi gì.
- `ac-2` (pending): version:sync chỉ định dạng lại các file nó thực sự ghi và không đụng các file markdown khác; có test chứng minh.
- `ac-3` (pending): Tài liệu chính sách phiên bản nêu --fold-dev cho task đóng epic.

## Required checks

- `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — chưa chạy / not yet run

## Evidence

_None recorded yet._
