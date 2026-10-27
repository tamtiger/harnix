# [10] Thiết kế lại learning để tự kích hoạt (không bỏ)

- **ID:** 20260928-205808-automate-learning
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-09-28 20:58:08 +07:00
- **Updated:** 2026-09-29 16:48:55 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Giữ cơ chế learning nhưng sửa điểm kích hoạt: (1) workflow --finish tự quét và tạo candidate đạt ngưỡng, không đòi agent tự nhớ gọi --learn; (2) đưa tóm tắt learning đã redact (giới hạn dòng) vào context đầu task Lite/Full qua effective-context; (3) trạng thái draft (1 task nguồn) tự nâng lên candidate khi task thứ hai xuất hiện; (4) decay/expiry cho candidate chưa promote; (5) giữ gate review thủ công khi ghi vào spec và giữ analyzeLearningStatement redaction/JSON-string boundary; (6) phạm vi project-local. Chạy trước slim-instructions nên sửa skill finish-work hiện có; slim-instructions sẽ chuyển nội dung sang harnix-verify.

## Non-goals

- Không commit/push/PR tự động.
- Không đụng cấu hình user-global thật trong test.
- Không bump version trong task này; version 2.0.0 chỉ bump một lần ở release-v2 (quyết định người dùng 2026-09-28).
- Không mở rộng learning ra cross-project/global; không tự động ghi vào spec.

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-auto-capture` (met): workflow --finish tự tạo candidate đạt ngưỡng mà không cần bước --learn riêng; có test.
- `ac-auto-surface` (met): Context đầu task Lite/Full có tóm tắt learning liên quan (giới hạn dòng, đã redact) khi có entry.
- `ac-hookless-surface` (met): Tóm tắt learning cũng đến được agent trên nền tảng không có hook (OpenCode, Cursor) qua output của workflow --preflight hoặc bước tường minh trong skill.
- `ac-draft-upgrade` (met): Candidate draft (1 nguồn) tự nâng lên candidate khi task thứ hai xuất hiện; có test.
- `ac-decay` (met): Candidate chưa promote quá hạn được đánh dấu archived/hạ ưu tiên; có test.
- `ac-promote-gate-unchanged` (met): Ghi vào spec vẫn yêu cầu review thủ công; không có đường tự động ghi vào spec.
- `ac-safety-unchanged` (met): Redaction và JSON-string injection boundary không bị nới lỏng; có test hồi quy.
- `ac-docs-sync` (met): PRD/WORKFLOW/IMPLEMENTATION_PLAN (và README/skill liên quan) được cập nhật trong cùng task cho mọi contract mà task này đổi; không dồn sang release-v2.

## Required checks

- `check-docs-sync` (focused): Test parity docs, skill và template pass — pass (2026-09-29 16:48:49 +07:00)
- `check-learning-core` (focused): Test đơn vị learning: trạng thái, decay, gộp nguồn, an toàn pass — pass (2026-09-29 16:48:50 +07:00)
- `check-learning-flow` (focused): Test luồng finish, hook context, preflight và hồi quy an toàn pass — pass (2026-09-29 16:48:51 +07:00)
- `check-suite` (full): Toàn bộ lint, typecheck và mọi suite test pass — pass (2026-09-29 16:48:52 +07:00)

## Decisions

- **d-observation-source** — Nguồn quan sát tự động là decisions, residualRisks và findings của evidence trong TaskRecord; không thêm trường vào schema v3.
  - _Why:_ Đó là văn bản review agent đã ghi sẵn, nên capture không tốn thao tác; đổi lại chỉ khớp được nội dung trùng sau chuẩn hóa, không khớp theo ngữ nghĩa.
- **d-risky-not-captured** — Quan sát bị analyzeLearningStatement gắn credential-like, instruction-override hoặc command-like không được capture hay surface tự động.
  - _Why:_ Tự động hóa trigger không được nới lỏng kiểm soát an toàn; chỉ đường thủ công có review mới xử lý nội dung rủi ro.
- **d-ttl** — TTL 28 ngày là hằng số; trạng thái archived được tính khi đọc, không ghi lại journal.
  - _Why:_ Journal append-only; tính khi đọc tránh ghi thừa và giữ nguyên dữ liệu gốc.

## Evidence

- pass (2026-09-29 16:36:59 +07:00): Migrated TaskRecord schema to v3 with explicit authorization.
- skipped (2026-09-29 16:37:00 +07:00): Task contract revised at persisted replan: Bổ sung check tập trung cho từng tiêu chí và chốt nguồn quan sát tự động sau khi khảo sát code learning hiện có.
- `check-docs-sync` — pass (2026-09-29 16:48:49 +07:00): Check check-docs-sync passed (exit 0):    Start at  16:47:41 |    Duration  1.42s (transform 674ms, setup 0ms, collect 1.97s, tests 283ms, 
- `check-learning-core` — pass (2026-09-29 16:48:50 +07:00): Check check-learning-core passed (exit 0):    Start at  16:47:44 |    Duration  1.84s (transform 816ms, setup 0ms, collect 5.42s, tests 239ms, 
- `check-learning-flow` — pass (2026-09-29 16:48:51 +07:00): Check check-learning-flow passed (exit 0):    Start at  16:47:48 |    Duration  4.37s (transform 524ms, setup 0ms, collect 1.21s, tests 2.68s, 
- `check-suite` — pass (2026-09-29 16:48:52 +07:00): Check check-suite passed (exit 0): Functions    : 98.3% ( 810/824 ) | Lines        : 93.48% ( 12956/13859 ) | =========================
