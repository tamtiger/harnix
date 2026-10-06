# Cho phép chứng minh bằng check tập trung khi baseline đỏ và đổi check ở verify không ép replan đầy đủ

- **ID:** 20261006-141321-baseline-red-verify-flow
- **Mode:** full
- **Epic:** 20261006-141317-workflow-field-feedback
- **Status:** planning/planning
- **Created:** 2026-10-06 14:13:30 +07:00
- **Updated:** 2026-10-06 17:00:36 +07:00

**Verdict:** PENDING — 0/4 acceptance criteria met

## Goal

Khi suite đã đỏ từ trước ngoài phạm vi task, người dùng có đường ghi nhận baseline đỏ có ủy quyền cùng check chứng minh tập trung, và thay check ở giai đoạn verifying quay lại verifying thay vì đi lại ready, in_progress, verifying, finishing.

## Non-goals

- Không tự động bỏ qua test đỏ mới do chính task gây ra
- Không làm yếu cổng suite mặc định khi baseline xanh

## Acceptance criteria

- `ac-1` (pending): Có flag ghi baseline của check (result, classification, authorizedBy, scope) mà không cần JSON, và finish/verify báo rõ suite đỏ sẵn đã được ủy quyền.
- `ac-2` (pending): Một check suite đỏ sẵn đã có baseline ủy quyền có thể đi kèm check tập trung bắt buộc làm bằng chứng chứng minh deliverable; ready và finish chấp nhận tổ hợp này và vẫn chặn khi không có ủy quyền.
- `ac-3` (pending): --replace-check hoặc --set-check khi task ở verifying đưa task về verifying/verifying nếu các check đã pass còn nguyên, thay vì replan; có test cho đường này.
- `ac-4` (pending): Quyết định về so sánh delta (chỉ fail test mới) được ghi lại, kèm lý do chọn hoặc không chọn.

## Required checks

- `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — chưa chạy / not yet run

## Decisions

- **baseline-red-authorized-focused-proof** — Khi suite đỏ sẵn ngoài phạm vi task, dùng baseline có ủy quyền của check suite (mở rộng check.baseline hiện có: result, classification, authorizedBy, scope) cùng một check focused bắt buộc làm bằng chứng cho deliverable; không so sánh delta test.
  - _Why:_ Mở rộng cơ chế đã có, giữ cổng suite mặc định khi baseline xanh và cần ủy quyền rõ ràng của người dùng; so sánh delta phải định danh từng test, phức tạp và dễ báo sai.

## Evidence

_None recorded yet._
