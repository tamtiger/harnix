# [08] Chuẩn hóa cấu trúc và chất lượng test

- **ID:** 20260928-205806-standardize-tests
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-09-28 20:58:06 +07:00
- **Updated:** 2026-09-29 13:41:40 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Hiện có 82 file test chia 7 suite (unit 38, integration 22, workflow 11, safety 5, platform 4, migration 2, support 2); file lớn nhất test/workflow/internal-workflow.test.ts 1.148 dòng; 6 module không có test trực tiếp (internal-context-cli.ts, repo-map-internal.ts, workflow-helpers.ts, global-surface.ts, global-managed-error.ts, global-managed-markers.ts); chưa đo coverage. Chuẩn hóa: cấu trúc thư mục test phản chiếu src; tên file <module>.test.ts; định nghĩa rõ mục đích từng suite (unit, integration, workflow, platform, safety); giữ suite migration làm suite tương thích dữ liệu cũ (task v1/v2, context.json, .harnix/roadmaps chuyển sang .harnix/epics) thay vì xoá, để script bắt buộc test:migration vẫn có nghĩa; tách test lớn theo module mới của restructure-code; builder dùng chung trong test/support cho TaskRecord, EpicRecord, repo tạm, home tạm, clock và múi giờ cố định; bổ sung test cho module chưa có; bật coverage bằng @vitest/coverage-v8 với ngưỡng bằng mức đo được hiện tại để chặn giảm.

## Non-goals

- Không commit/push/PR tự động.
- Không đụng cấu hình user-global thật trong test.
- Không bump version trong task này; version 2.0.0 chỉ bump một lần ở release-v2 (quyết định người dùng 2026-09-28).
- Không nới lỏng assertion để test pass; không gỡ test đang bảo vệ hành vi còn tồn tại.
- Không tự cài @vitest/coverage-v8: cần mạng, phải hỏi người dùng trước khi cài.

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-test-layout` (met): Thư mục test phản chiếu src và mọi file theo quy ước <module>.test.ts; có tài liệu ngắn mô tả mục đích từng suite.
- `ac-split-large-tests` (met): Không file test nào > 400 dòng.
- `ac-shared-builders` (met): Builder dùng chung cho TaskRecord, EpicRecord, repo tạm, home tạm, clock và múi giờ; không còn fixture dựng tay lặp lại giữa các file.
- `ac-untested-modules` (met): Mọi module trong src có ít nhất một test trực tiếp hoặc được ghi rõ lý do.
- `ac-coverage-floor` (met): pnpm test chạy coverage với ngưỡng bằng mức đo hiện tại; ngưỡng được ghi vào vitest.config.ts.
- `ac-no-weakening` (met): Số assertion và hành vi được kiểm không giảm; toàn bộ suite pass.
- `ac-docs-sync` (met): PRD/WORKFLOW/IMPLEMENTATION_PLAN (và README/skill liên quan) được cập nhật trong cùng task cho mọi contract mà task này đổi; không dồn sang release-v2.

## Required checks

- `check-coverage` (focused): Toàn bộ test chạy với coverage và đạt ngưỡng trong vitest.config.ts — pass (2026-09-29 13:41:34 +07:00)
- `check-docs-sync` (focused): Test parity docs pass — pass (2026-09-29 13:41:35 +07:00)
- `check-test-structure` (focused): Test cấu trúc: bố cục, cỡ file, builder, module có test, baseline không giảm — pass (2026-09-29 13:41:36 +07:00)
- `check-suite` (full): Toàn bộ lint, typecheck và mọi suite test pass — pass (2026-09-29 13:41:37 +07:00)

## Decisions

- **d-install-approved** — @vitest/coverage-v8 3.2.7 được cài bằng pnpm add -D sau khi người dùng cho phép rõ ràng ngày 2026-09-29.
  - _Why:_ Task cấm tự cài package vì cần mạng; đã hỏi và được duyệt.
- **d-layout** — test/unit phản chiếu src; test/integration/commands phản chiếu src/commands; các suite còn lại đặt tên theo tính năng và được mô tả trong test/README.md.
  - _Why:_ Phản chiếu tuyệt đối mọi suite làm test kịch bản (workflow, platform, safety) mất ý nghĩa, trong khi unit và command test vốn gắn với đúng một module.
- **d-baseline** — Baseline không được giảm: 689 test chạy (thêm 1 skipped) và 2.338 lệnh expect đo trước task.
  - _Why:_ Chặn việc tách hay gộp test âm thầm làm yếu kiểm chứng; số này được kiểm bằng test cấu trúc.

## Evidence

- pass (2026-09-29 13:12:25 +07:00): Migrated TaskRecord schema to v3 with explicit authorization.
- skipped (2026-09-29 13:12:26 +07:00): Task contract revised at persisted replan: Bổ sung check tập trung cho từng tiêu chí sau khi đo baseline test và coverage.
- `check-coverage` — pass (2026-09-29 13:41:34 +07:00): Check check-coverage passed (exit 0): Functions    : 98.18% ( 758/772 ) | Lines        : 93.19% ( 12141/13027 ) | ========================
- `check-docs-sync` — pass (2026-09-29 13:41:35 +07:00): Check check-docs-sync passed (exit 0):    Start at  13:40:37 |    Duration  1.31s (transform 586ms, setup 0ms, collect 1.73s, tests 257ms, 
- `check-test-structure` — pass (2026-09-29 13:41:36 +07:00): Check check-test-structure passed (exit 0):    Start at  13:40:40 |    Duration  612ms (transform 59ms, setup 0ms, collect 62ms, tests 141ms, en
- `check-suite` — pass (2026-09-29 13:41:37 +07:00): Check check-suite passed (exit 0): Functions    : 98.18% ( 758/772 ) | Lines        : 93.19% ( 12141/13027 ) | ========================
