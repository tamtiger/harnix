# Giảm output dài của ready dry-run, finish và các gợi ý lặp

- **ID:** 20261006-202546-quiet-advisories
- **Mode:** full
- **Epic:** 20261006-202542-harnix-self-improvement
- **Status:** planning/planning
- **Created:** 2026-10-06 20:25:42 +07:00
- **Updated:** 2026-10-06 20:25:42 +07:00

**Verdict:** PENDING — 0/3 acceptance criteria met

## Goal

Các thông báo dài lặp lại ở mỗi lần gọi (advisory chưa baseline từng check trong ready dry-run, hint learning ở --finish) tốn token mà không đổi quyết định; gộp chúng thành một dòng ngắn có số lượng.

## Non-goals

- Không nới ngưỡng hay bỏ test cấu trúc
- Không đổi hành vi hiện có ngoài phạm vi tiêu chí

## Acceptance criteria

- `ac-1` (pending): transition --dry-run gộp mọi advisory chưa baseline thành một mục duy nhất nêu số check, vẫn giữ unbaselinedChecks; advisory glob không khớp file giữ nguyên.
- `ac-2` (pending): learning.hint của --finish --brief rút còn một câu ngắn và chỉ xuất hiện khi captured bằng 0.
- `ac-3` (pending): Có test đo độ dài output trước và sau cho một task mẫu để chặn hồi quy phình to.

## Required checks

- `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — chưa chạy / not yet run

## Evidence

_None recorded yet._
