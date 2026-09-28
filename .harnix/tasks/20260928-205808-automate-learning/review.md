# [10] Thiết kế lại learning để tự kích hoạt (không bỏ)

- **ID:** 20260928-205808-automate-learning
- **Mode:** full
- **Status:** planning/planning
- **Created:** 2026-09-28T20:58:08.000+07:00
- **Updated:** 2026-09-28T20:58:28.000+07:00

**Verdict:** PENDING — 0/8 acceptance criteria met

## Goal

Giữ cơ chế learning nhưng sửa điểm kích hoạt: (1) workflow --finish tự quét và tạo candidate đạt ngưỡng, không đòi agent tự nhớ gọi --learn; (2) đưa tóm tắt learning đã redact (giới hạn dòng) vào context đầu task Lite/Full qua effective-context; (3) trạng thái draft (1 task nguồn) tự nâng lên candidate khi task thứ hai xuất hiện; (4) decay/expiry cho candidate chưa promote; (5) giữ gate review thủ công khi ghi vào spec và giữ analyzeLearningStatement redaction/JSON-string boundary; (6) phạm vi project-local. Chạy trước slim-instructions nên sửa skill finish-work hiện có; slim-instructions sẽ chuyển nội dung sang harnix-verify.

## Non-goals

- Không commit/push/PR tự động.
- Không đụng cấu hình user-global thật trong test.
- Không bump version trong task này; version 2.0.0 chỉ bump một lần ở release-v2 (quyết định người dùng 2026-09-28).
- Không mở rộng learning ra cross-project/global; không tự động ghi vào spec.

## Acceptance criteria

- `ac-auto-capture` (pending): workflow --finish tự tạo candidate đạt ngưỡng mà không cần bước --learn riêng; có test.
- `ac-auto-surface` (pending): Context đầu task Lite/Full có tóm tắt learning liên quan (giới hạn dòng, đã redact) khi có entry.
- `ac-hookless-surface` (pending): Tóm tắt learning cũng đến được agent trên nền tảng không có hook (OpenCode, Cursor) qua output của workflow --preflight hoặc bước tường minh trong skill.
- `ac-draft-upgrade` (pending): Candidate draft (1 nguồn) tự nâng lên candidate khi task thứ hai xuất hiện; có test.
- `ac-decay` (pending): Candidate chưa promote quá hạn được đánh dấu archived/hạ ưu tiên; có test.
- `ac-promote-gate-unchanged` (pending): Ghi vào spec vẫn yêu cầu review thủ công; không có đường tự động ghi vào spec.
- `ac-safety-unchanged` (pending): Redaction và JSON-string injection boundary không bị nới lỏng; có test hồi quy.
- `ac-docs-sync` (pending): PRD/WORKFLOW/IMPLEMENTATION_PLAN (và README/skill liên quan) được cập nhật trong cùng task cho mọi contract mà task này đổi; không dồn sang release-v2.

## Required checks

- `check-suite` (focused): Toàn bộ lint, typecheck và mọi suite test pass (bản nháp, bổ sung check tập trung khi planning) — chưa chạy / not yet run

## Decisions

- **d-draft-checks** — check-suite là bản nháp; trong planning của chính task phải bổ sung check tập trung cho từng AC (lệnh, inputs, criterionIds) trước khi ready.
  - _Why:_ Review trước implement: một check chung pnpm lint/typecheck/test không chứng minh được các AC định lượng (token, churn, số hệ sinh thái).

## Evidence

_None recorded yet._
