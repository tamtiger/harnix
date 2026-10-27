# PRD: Cổng ready cảnh báo plan.md nhắc id check không khai báo

## Vấn đề

Cổng ready đã bắt tiêu chí không được `plan.md` nhắc tới và tiêu chí thiếu check focused, nhưng không bắt chiều ngược lại: `plan.md` còn nhắc một check đã đổi tên hoặc mới thêm (ví dụ `check-2b`) mà `validationPlan` không có. Plan và task lệch nhau mà không ai biết cho đến khi chạy check.

## Mục tiêu

`harnix workflow --transition ready/ready --dry-run` thêm một advisory (không chặn ready) khi `plan.md` của task Full nhắc id check không có trong `validationPlan`.

## Hành vi

- Phạm vi quét: chỉ id có tiền tố `check-` (quy ước đặt tên check của Harnix: `check-suite`, `check-fold`, ...) đứng trong dấu backtick, hoặc là từ đầu tiên của một mục checklist `- [ ] check-x ...`; bỏ qua code fence và văn bản thường.
- Một id là "đã khai báo" khi trùng đúng một `validationPlan[].id` (kể cả check không bắt buộc).
- Kết quả: đúng một advisory gộp, dạng `plan.md names N unknown check id(s): a, b (not in validationPlan).`, tối đa 5 id (thêm `+M more` nếu nhiều hơn), cùng kiểu gọn của task quiet-advisories.
- Chỉ áp dụng khi task Full đang vào `ready/ready` (cùng điều kiện với các quy tắc nội dung khác); task Lite không có `plan.md` nên không bị ảnh hưởng.

## Ngoài phạm vi

- Không chặn ready, không đổi `issues`, không quét check có tiền tố khác `check-` (giới hạn đã biết: check đặt tên kiểu khác như `chk-1` không được cảnh báo).
- Không đổi tài liệu CLI hay schema (đầu ra dry-run vẫn là `advisories: string[]`).

## Rủi ro

Heuristic theo tiền tố có thể bỏ sót; chấp nhận để tránh báo sai trên các từ thường.
