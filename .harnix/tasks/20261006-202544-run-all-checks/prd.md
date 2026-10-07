# PRD: Một lệnh chạy mọi check bắt buộc và tóm tắt kết quả

## Vấn đề

Ở giai đoạn verify, agent gọi `harnix workflow --run-check <id> -- <lệnh>` lần lượt cho từng check bắt buộc, mỗi lần phải gõ lại đúng command đã khai báo và đọc một khối JSON riêng. Tốn lượt gọi và token.

## Mục tiêu

`harnix workflow --run-checks [--brief]` chạy tuần tự các check bắt buộc cần chạy, ghi evidence y như `--run-check`, dừng ở check đầu tiên fail và in một đối tượng rất ngắn.

## Hành vi

- Check cần chạy: trạng thái `pending`, `stale` hoặc `failed` theo `inspectRequiredChecks` (check `failed` được chạy lại để dùng sau khi sửa lỗi; xem decision `d-failed-reruns`). Check `passed` còn tươi bị bỏ qua.
- Thứ tự: check `focused` trước, `full` sau cùng; trong cùng scope giữ thứ tự khai báo.
- Mỗi check chạy bằng đúng `command` và `cwd` đã khai báo, qua `runCheckWorkflow` (snapshot, chạy không shell, snapshot, ghi evidence).
- Kiểm tra trước, không chạy gì nếu: một check cần chạy ở trạng thái circuit breaker `stop`, hoặc không khai báo `command`. Lỗi nêu id check và lý do.
- Output: `{ ran: [{ id, result, exitCode }], remaining: [id...] }`. Không có output của lệnh khi pass; check fail kèm `outputTail` (bỏ khi `--brief`).

## Ngoài phạm vi

- Không chạy lệnh ghép `a && b` (khai báo một check cho mỗi lệnh, như `--run-check`).
- Không đổi hành vi `--run-check`, breaker hay cổng suite.
- Không thêm mạng, dịch vụ hay dependency.

## Tài liệu

Cookbook trong `.harnix/workflow.md` (template) và skill `harnix-verify` ghi `--run-checks` là đường chính khi verify.
