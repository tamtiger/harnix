# [08] Chuẩn hóa cấu trúc và chất lượng test

- **ID:** 20260928-205806-standardize-tests
- **Mode:** full
- **Status:** planning/planning
- **Created:** 2026-09-28T20:58:06.000+07:00
- **Updated:** 2026-09-28T20:58:28.000+07:00

**Verdict:** PENDING — 0/7 acceptance criteria met

## Goal

Hiện có 82 file test chia 7 suite (unit 38, integration 22, workflow 11, safety 5, platform 4, migration 2, support 2); file lớn nhất test/workflow/internal-workflow.test.ts 1.148 dòng; 6 module không có test trực tiếp (internal-context-cli.ts, repo-map-internal.ts, workflow-helpers.ts, global-surface.ts, global-managed-error.ts, global-managed-markers.ts); chưa đo coverage. Chuẩn hóa: cấu trúc thư mục test phản chiếu src; tên file <module>.test.ts; định nghĩa rõ mục đích từng suite (unit, integration, workflow, platform, safety); giữ suite migration làm suite tương thích dữ liệu cũ (task v1/v2, context.json, .harnix/roadmaps chuyển sang .harnix/epics) thay vì xoá, để script bắt buộc test:migration vẫn có nghĩa; tách test lớn theo module mới của restructure-code; builder dùng chung trong test/support cho TaskRecord, EpicRecord, repo tạm, home tạm, clock và múi giờ cố định; bổ sung test cho module chưa có; bật coverage bằng @vitest/coverage-v8 với ngưỡng bằng mức đo được hiện tại để chặn giảm.

## Non-goals

- Không commit/push/PR tự động.
- Không đụng cấu hình user-global thật trong test.
- Không bump version trong task này; version 2.0.0 chỉ bump một lần ở release-v2 (quyết định người dùng 2026-09-28).
- Không nới lỏng assertion để test pass; không gỡ test đang bảo vệ hành vi còn tồn tại.
- Không tự cài @vitest/coverage-v8: cần mạng, phải hỏi người dùng trước khi cài.

## Acceptance criteria

- `ac-test-layout` (pending): Thư mục test phản chiếu src và mọi file theo quy ước <module>.test.ts; có tài liệu ngắn mô tả mục đích từng suite.
- `ac-split-large-tests` (pending): Không file test nào > 400 dòng.
- `ac-shared-builders` (pending): Builder dùng chung cho TaskRecord, EpicRecord, repo tạm, home tạm, clock và múi giờ; không còn fixture dựng tay lặp lại giữa các file.
- `ac-untested-modules` (pending): Mọi module trong src có ít nhất một test trực tiếp hoặc được ghi rõ lý do.
- `ac-coverage-floor` (pending): pnpm test chạy coverage với ngưỡng bằng mức đo hiện tại; ngưỡng được ghi vào vitest.config.ts.
- `ac-no-weakening` (pending): Số assertion và hành vi được kiểm không giảm; toàn bộ suite pass.
- `ac-docs-sync` (pending): PRD/WORKFLOW/IMPLEMENTATION_PLAN (và README/skill liên quan) được cập nhật trong cùng task cho mọi contract mà task này đổi; không dồn sang release-v2.

## Required checks

- `check-suite` (focused): Toàn bộ lint, typecheck và mọi suite test pass (bản nháp, bổ sung check tập trung khi planning) — chưa chạy / not yet run

## Decisions

- **d-draft-checks** — check-suite là bản nháp; trong planning của chính task phải bổ sung check tập trung cho từng AC (lệnh, inputs, criterionIds) trước khi ready.
  - _Why:_ Review trước implement: một check chung pnpm lint/typecheck/test không chứng minh được các AC định lượng (token, churn, số hệ sinh thái).

## Evidence

_None recorded yet._
