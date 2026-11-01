# PRD: Chặn --run-check ghi pass khi check không khai command và làm save epic idempotent

## Context & Problem Statement

- `workflow --run-check` chỉ so argv với `command` đã khai khi `declared.command !== undefined`; một check bắt buộc không khai `command` vẫn chạy argv bất kỳ rồi ghi pass (khe hở A5). Validator task cho phép `command` tùy chọn nên không ngăn được.
- `workflow --save` có `epic`/`epicMembers`: nếu `upsertEpic`/`renderEpicMarkdown` ném lỗi sau khi `saveTask` đã commit thì không rollback (đúng, task đã commit), nhưng gửi lại cùng envelope đi vào nhánh replay (`replayCommittedSave`) trả task cũ mà KHÔNG chạy lại tác dụng phụ epic, nên epic thiếu vĩnh viễn (R7).

## Scope & Boundaries

Trong phạm vi:
- `--run-check` từ chối khi check `required` không khai `command`, hint trỏ `--set-check <id> --command`; khi argv khác lệnh đã khai thì thông báo in lệnh đã khai (qua `describeCommand`).
- `--run-checks` giữ nguyên: đã từ chối check không có command; giữ test hồi quy. `--evidence` thủ công không đổi.
- Replay envelope sau lỗi epic: sửa lại epic và members còn thiếu, idempotent.

Ngoài phạm vi (residual risk): hai bước save của `--set-criterion` kẹt `ready/ready`; doctor finding cho epic thiếu; không đổi schema TaskRecord hay frozen contract.

## Anchored Acceptance Criteria

- ac-1: `--run-check` từ chối check bắt buộc không có command, hoặc argv khác command đã khai, kèm thông báo/hint đúng; `--run-checks` và `--evidence` không đổi.
- ac-2: chạy lại cùng envelope `--save` sau lỗi epic giữa chừng thì thành công và epic cùng members đầy đủ.

Check: `chk-focused` (test tập trung), `chk-gates` (`pnpm run test:gates`), `chk-suite` (`pnpm run test`).

## Architectural & Safety Constraints

- Tuân thủ `AGENTS.md` và `.harnix/spec/guides/`; file trong `src/core/workflow` tối đa 300 dòng code; import alias `src/...`.
- Không ghi evidence khi lệnh chưa được xác nhận khớp; không in đường dẫn máy; thay đổi trạng thái chỉ qua `harnix workflow`.
- Replay chỉ tạo phần thiếu, không ghi đè epic/member đã có khác nội dung (member khác vẫn bị từ chối như cũ).
