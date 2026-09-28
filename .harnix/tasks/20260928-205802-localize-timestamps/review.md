# [04] Chuyển mọi thời gian sang múi giờ cấu hình (giờ Việt Nam)

- **ID:** 20260928-205802-localize-timestamps
- **Mode:** full
- **Status:** planning/planning
- **Created:** 2026-09-28T20:58:02.000+07:00
- **Updated:** 2026-09-28T20:58:28.000+07:00

**Verdict:** PENDING — 0/7 acceptance criteria met

## Goal

Thêm timezone (tên IANA) vào .harnix/config.yaml, mặc định lấy từ hệ thống lúc init qua Intl (không qua biến TZ của shell, vì Git Bash trên Windows không nhận tên múi giờ); repo này đặt Asia/Ho_Chi_Minh. Một hàm thời gian duy nhất (clock inject được) thay 13 chỗ new Date().toISOString() trong src, ghi ISO 8601 kèm offset (ví dụ 2026-09-28T20:30:01.000+07:00). Tiền tố ID YYYYMMDD-HHMMSS của task/epic, ngày phân vùng journal, và hiển thị trong review.md, trang epic, status dùng cùng múi giờ. So sánh vẫn theo thời điểm tuyệt đối nên dữ liệu cũ dạng Z đọc và sắp xếp đúng. Không ghi lại task lịch sử; chỉ hiển thị chúng theo múi giờ cấu hình.

## Non-goals

- Không commit/push/PR tự động.
- Không đụng cấu hình user-global thật trong test.
- Không bump version trong task này; version 2.0.0 chỉ bump một lần ở release-v2 (quyết định người dùng 2026-09-28).
- Không ghi lại task/journal lịch sử (làm stale evidence và digest).

## Acceptance criteria

- `ac-config-timezone` (pending): config.yaml có timezone IANA hợp lệ, mặc định lấy từ hệ thống lúc init, validator từ chối tên không hợp lệ; config cũ thiếu field vẫn đọc được.
- `ac-single-clock` (pending): Không còn new Date().toISOString() rải rác trong src; mọi timestamp ghi ra có offset của múi giờ cấu hình; có test với clock và múi giờ cố định.
- `ac-ids-journal` (pending): Tiền tố ID task/epic và ngày phân vùng journal theo múi giờ cấu hình; có test chuyển ngày quanh nửa đêm giờ Việt Nam.
- `ac-display` (pending): review.md, trang epic và status hiển thị thời gian theo múi giờ cấu hình, kể cả dữ liệu cũ dạng Z.
- `ac-agent-time-source` (pending): Harness cung cấp thời gian hiện tại và tiền tố ID theo múi giờ cấu hình (ví dụ trong output của workflow --preflight hoặc --schema), skill hướng dẫn agent dùng giá trị này thay vì lệnh date của shell (Git Bash trên Windows bỏ qua tên múi giờ và trả UTC — đã gặp trong phiên audit).
- `ac-legacy-order` (pending): Dữ liệu trộn Z và +07:00 vẫn sắp xếp đúng theo thời điểm tuyệt đối; task lịch sử không bị ghi lại.
- `ac-docs-sync` (pending): PRD/WORKFLOW/IMPLEMENTATION_PLAN (và README/skill liên quan) được cập nhật trong cùng task cho mọi contract mà task này đổi; không dồn sang release-v2.

## Required checks

- `check-suite` (focused): Toàn bộ lint, typecheck và mọi suite test pass (bản nháp, bổ sung check tập trung khi planning) — chưa chạy / not yet run

## Decisions

- **d-draft-checks** — check-suite là bản nháp; trong planning của chính task phải bổ sung check tập trung cho từng AC (lệnh, inputs, criterionIds) trước khi ready.
  - _Why:_ Review trước implement: một check chung pnpm lint/typecheck/test không chứng minh được các AC định lượng (token, churn, số hệ sinh thái).

## Evidence

_None recorded yet._
