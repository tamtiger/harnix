# PRD: Giảm output dài của ready dry-run, finish và các gợi ý lặp

## Vấn đề

Hai thông báo lặp lại ở mỗi lần gọi và không đổi quyết định nào: advisory "chưa baseline" của từng check trong `--transition ready/ready --dry-run`, và `learning.hint` dài ở `--finish --brief`. Mỗi lần tốn token vô ích.

## Mục tiêu

- Dry-run ready: mọi check chưa baseline gộp thành **một** advisory ngắn có số lượng; trường `unbaselinedChecks` vẫn nêu id; advisory glob không khớp file giữ nguyên.
- `--finish`: `learning.hint` là một câu ngắn (không quá 90 ký tự), chỉ có khi `captured` bằng 0.
- Có test chặn hồi quy phình to của hai output này.

## Ngoài phạm vi

Không đổi điều kiện của cổng ready, cách bắt learning, hay các advisory/issue khác.

## Ghi chú quy trình

Phần code của task này đã được viết khi task còn `planning` (sai thứ tự quy trình); kế hoạch này mô tả đúng phần đã làm và được đưa lên `ready` để người dùng duyệt trước khi hoàn tất bump, verify và finish.
