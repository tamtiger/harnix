# [03] Đơn giản hóa hợp đồng task và evidence

- **ID:** 20260928-205801-simplify-task-contract
- **Mode:** full
- **Status:** planning/planning
- **Created:** 2026-09-28T20:58:01.000+07:00
- **Updated:** 2026-09-28T20:58:28.000+07:00

**Verdict:** PENDING — 0/5 acceptance criteria met

## Goal

Thay TaskRecord v2 + sidecar verification-inputs + contractRevision 5 bước + ready-trace grammar + execution-notes grammar bằng record gọn: checks có criterionIds, evidence có exit code và digest tùy chọn nội tuyến, replan một bước có reason; v1/v2 chỉ đọc qua adapter; Lite không cần prd/plan. Harness không tự chạy lệnh (không thêm process runner). Không tách module code (thuộc restructure-code).

## Non-goals

- Không commit/push/PR tự động.
- Không đụng cấu hình user-global thật trong test.
- Không bump version trong task này; version 2.0.0 chỉ bump một lần ở release-v2 (quyết định người dùng 2026-09-28).
- Không thêm process runner hay cho harness tự chạy lệnh từ task.json (rủi ro command injection; root cause sự cố pause là check quá hẹp, xử lý ở add-verify-detection).

## Acceptance criteria

- `ac-schema` (pending): Schema mới được đóng băng trong docs và validator; hidden --save chấp nhận nó.
- `ac-no-sidecar` (pending): Task mới không tạo verification-inputs.json; churn .harnix của một task mẫu ≤ 200 dòng.
- `ac-legacy-read` (pending): 69 task lịch sử (v1 và v2) vẫn đọc được bởi status/tasks/roadmap.
- `ac-no-execution-notes` (pending): Execution-notes grammar được gỡ khỏi validator, skill và docs; plan.md cũ có vùng execution-notes vẫn đọc được.
- `ac-docs-sync` (pending): PRD/WORKFLOW/IMPLEMENTATION_PLAN (và README/skill liên quan) được cập nhật trong cùng task cho mọi contract mà task này đổi; không dồn sang release-v2.

## Required checks

- `check-suite` (focused): Toàn bộ lint, typecheck và mọi suite test pass (bản nháp, bổ sung check tập trung khi planning) — chưa chạy / not yet run

## Decisions

- **d-draft-checks** — check-suite là bản nháp; trong planning của chính task phải bổ sung check tập trung cho từng AC (lệnh, inputs, criterionIds) trước khi ready.
  - _Why:_ Review trước implement: một check chung pnpm lint/typecheck/test không chứng minh được các AC định lượng (token, churn, số hệ sinh thái).

## Evidence

_None recorded yet._
