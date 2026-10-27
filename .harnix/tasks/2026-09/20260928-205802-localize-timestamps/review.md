# [04] Chuyển mọi thời gian sang múi giờ cấu hình (giờ Việt Nam)

- **ID:** 20260928-205802-localize-timestamps
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-09-28 20:58:02 +07:00
- **Updated:** 2026-09-29 10:45:56 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Thêm timezone (tên IANA) vào .harnix/config.yaml, mặc định lấy từ hệ thống lúc init qua Intl (không qua biến TZ của shell, vì Git Bash trên Windows không nhận tên múi giờ); repo này đặt Asia/Ho_Chi_Minh. Một hàm thời gian duy nhất (clock inject được) thay 13 chỗ new Date().toISOString() trong src, ghi ISO 8601 kèm offset (ví dụ 2026-09-28T20:30:01.000+07:00). Tiền tố ID YYYYMMDD-HHMMSS của task/epic, ngày phân vùng journal, và hiển thị trong review.md, trang epic, status dùng cùng múi giờ. So sánh vẫn theo thời điểm tuyệt đối nên dữ liệu cũ dạng Z đọc và sắp xếp đúng. Không ghi lại task lịch sử; chỉ hiển thị chúng theo múi giờ cấu hình.

## Non-goals

- Không commit/push/PR tự động.
- Không đụng cấu hình user-global thật trong test.
- Không bump version trong task này; version 2.0.0 chỉ bump một lần ở release-v2 (quyết định người dùng 2026-09-28).
- Không ghi lại task/journal lịch sử (làm stale evidence và digest).

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-config-timezone` (met): config.yaml có timezone IANA hợp lệ, mặc định lấy từ hệ thống lúc init, validator từ chối tên không hợp lệ; config cũ thiếu field vẫn đọc được.
- `ac-single-clock` (met): Không còn toISOString() rải rác trong src ngoài module thời gian; mọi timestamp ghi ra qua đường lệnh có offset của múi giờ cấu hình; có test với clock và múi giờ cố định.
- `ac-ids-journal` (met): Tiền tố ID task/epic (do harness cung cấp) và ngày phân vùng journal theo múi giờ cấu hình; có test chuyển ngày quanh nửa đêm giờ Việt Nam.
- `ac-display` (met): review.md và trang epic hiển thị thời gian theo múi giờ cấu hình, kể cả dữ liệu cũ dạng Z; status không phát sinh timestamp mới.
- `ac-agent-time-source` (met): workflow --preflight trả clock (timezone, now, idPrefix) theo múi giờ cấu hình và skill hướng dẫn agent dùng giá trị này thay cho lệnh date của shell.
- `ac-legacy-order` (met): Dữ liệu trộn Z và +07:00 vẫn sắp xếp đúng theo thời điểm tuyệt đối; task lịch sử không bị ghi lại.
- `ac-docs-sync` (met): PRD/WORKFLOW/IMPLEMENTATION_PLAN (và README/skill liên quan) được cập nhật trong cùng task cho mọi contract mà task này đổi; không dồn sang release-v2.

## Required checks

- `check-clock-config` (focused): Test đơn vị module thời gian và config timezone pass — pass (2026-09-29 10:45:50 +07:00)
- `check-docs-sync` (focused): Test đồng bộ docs, skill, template và self-host pass — pass (2026-09-29 10:45:51 +07:00)
- `check-time-flow` (focused): Test luồng thời gian: offset cấu hình, journal, preflight, hiển thị pass — pass (2026-09-29 10:45:52 +07:00)
- `check-suite` (full): Toàn bộ lint, typecheck và mọi suite test pass — pass (2026-09-29 10:45:53 +07:00)

## Decisions

- **d-core-default-utc** — Core giữ tham số now tùy chọn; mặc định đi qua clock.ts (UTC). Mọi đường lệnh truyền thời gian theo múi giờ cấu hình.
  - _Why:_ Tránh đổi chữ ký hàng loạt (khoảng 30 chỗ gọi trong test) mà vẫn đảm bảo dữ liệu ghi ra qua CLI có offset cấu hình.
- **d-status-no-time** — harnix status không phát sinh timestamp nên giữ nguyên hình dạng; AC hiển thị chỉ áp dụng cho review.md và trang epic.
  - _Why:_ Thêm timestamp vào status là đổi contract công khai không có nhu cầu; AC gốc giả định status có timestamp.
- **d-clock-in-preflight** — Nguồn thời gian cho agent là khối clock trong workflow --preflight.
  - _Why:_ Preflight đã là bước bắt buộc trước công việc Lite/Full và no-write; tránh thêm lệnh mới.

## Evidence

- pass (2026-09-29 10:36:48 +07:00): Migrated TaskRecord schema to v3 with explicit authorization.
- skipped (2026-09-29 10:36:49 +07:00): Task contract revised at persisted replan: Bổ sung check tập trung cho từng tiêu chí, làm rõ tiêu chí hiển thị thời gian sau khi khảo sát code.
- `check-clock-config` — pass (2026-09-29 10:45:50 +07:00): Check check-clock-config passed (exit 0):    Start at  10:45:09 |    Duration  607ms (transform 92ms, setup 0ms, collect 180ms, tests 88ms, environment 
- `check-docs-sync` — pass (2026-09-29 10:45:51 +07:00): Check check-docs-sync passed (exit 0):    Start at  10:45:12 |    Duration  1.59s (transform 860ms, setup 0ms, collect 2.81s, tests 388ms, environmen
- `check-time-flow` — pass (2026-09-29 10:45:52 +07:00): Check check-time-flow passed (exit 0):    Start at  10:45:15 |    Duration  1.78s (transform 317ms, setup 0ms, collect 726ms, tests 653ms, environmen
- `check-suite` — pass (2026-09-29 10:45:53 +07:00): Check check-suite passed (exit 0):    Start at  10:45:26 |    Duration  15.42s (transform 3.95s, setup 0ms, collect 33.07s, tests 84.21s, environ
