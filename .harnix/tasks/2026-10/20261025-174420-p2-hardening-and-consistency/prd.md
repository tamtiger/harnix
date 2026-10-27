# PRD: Sửa lỗi P2, đồng bộ quyết định A3/A5 và gợi ý lệnh đúng

## Context & Problem Statement

Đợt review toàn diện tái hiện được nhiều lỗi P2: breaker bị mở bằng evidence `skipped` giả, cờ được nhận im lặng ở action không dùng nó, `status --criteria` khác hành vi các chế độ status khác, id learning thô, `restoreFullArtifacts` dùng `task.id`, collision vĩnh viễn sau crash giữa transaction. Người dùng đã chốt A3 (breaker mở lại khi input digest đổi) và A5 (sửa chữ tiêu chí có evidence khi có `--reason`), nên `--run-checks` và tài liệu phải khớp. Agent gõ sai lệnh thường chỉ nhận lỗi trần, không có gợi ý lệnh đúng.

## Scope & Boundaries

Trong phạm vi: ac-1 đến ac-10 trong `task.json`. Ngoài phạm vi: refactor bảng ACTIONS (task refactor), tối ưu token, tốc độ test, các nghi vấn đã ghi residual risk.

## Anchored Acceptance Criteria

- ac-1: evidence `skipped` giả không mở breaker.
- ac-2: cờ không owner bị từ chối, `--check` lặp không bị ghép.
- ac-3: `status --criteria` không có task trả null, từ chối `--limit`.
- ac-4: learning chuẩn hóa id.
- ac-5: `restoreFullArtifacts` bỏ qua task lệch id.
- ac-6: crash giữa file và manifest không để lại collision vĩnh viễn.
- ac-7: tài liệu ghi đúng hành vi `--set-criterion` (A5).
- ac-8: `--run-checks` dùng digest hiện tại cho breaker, tài liệu ghi đúng (A3).
- ac-9: ba lỗi P3 rẻ.
- ac-10: lỗi kèm gợi ý lệnh đúng, định dạng lỗi thống nhất.

## Architectural & Safety Constraints

Tuân thủ AGENTS.md và .harnix/spec/guides/. Hook `harnix context` giữ nguyên giao thức (không in JSON lỗi lên stdout). Output lỗi của `harnix workflow` thêm JSON `{ ok: false, error: { exitCode, message, hint? } }` trên stdout, dòng chữ vẫn ở stderr; cập nhật docs/HARNIX_WORKFLOW.md và test. Không đổi field hay enum đóng băng của TaskRecord. Golden chỉ cập nhật đúng chuỗi mới.
