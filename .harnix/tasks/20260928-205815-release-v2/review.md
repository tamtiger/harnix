# [17] Tinh gọn gate phát hành, rà nhất quán docs và phát hành 2.0.0

- **ID:** 20260928-205815-release-v2
- **Mode:** full
- **Status:** planning/planning
- **Created:** 2026-09-28T20:58:15.000+07:00
- **Updated:** 2026-09-28T20:58:28.000+07:00

**Verdict:** PENDING — 0/6 acceptance criteria met

## Goal

Bỏ chạy trùng trong test:acceptance, rà 17 script; rà nhất quán lần cuối PRD/WORKFLOW/IMPLEMENTATION_PLAN/README (các task trước đã tự cập nhật docs của mình); bump version 2.0.0 một lần qua pnpm version:sync và viết một entry CHANGELOG tổng hợp toàn bộ epic, gồm các breaking change; chạy đủ acceptance sequence ở docs/IMPLEMENTATION_PLAN.md section 11 cùng fake-home tarball smoke.

## Non-goals

- Không commit/push/PR tự động.
- Không đụng cấu hình user-global thật trong test.

## Acceptance criteria

- `ac-gates` (pending): Acceptance sequence không chạy lại cùng test hai lần và tổng thời gian giảm so với hiện tại.
- `ac-docs-consistency` (pending): PRD/WORKFLOW/IMPLEMENTATION_PLAN/README nhất quán với sản phẩm sau đại tu; không còn tham chiếu tới thành phần đã gỡ.
- `ac-version-2` (pending): package.json và mọi nơi đồng bộ version là 2.0.0; CHANGELOG có đúng một entry 2.0.0 liệt kê breaking change và hướng dẫn migrate.
- `ac-acceptance` (pending): Acceptance sequence section 11 (gồm format:check và coverage floor) và fake-home tarball smoke pass với evidence mới.
- `ac-managed-output` (pending): Sau khi bump 2.0.0, .harnix/workflow.md và .harnix/.template-hashes.json được sinh lại (generatorVersion 2.0.0) và self-host test pass.
- `ac-no-exemptions` (pending): Danh sách miễn trừ max-lines trống; mọi file trong src ≤ 300 dòng.

## Required checks

- `check-suite` (focused): Toàn bộ lint, typecheck và mọi suite test pass (bản nháp, bổ sung check tập trung khi planning) — chưa chạy / not yet run

## Decisions

- **d-draft-checks** — check-suite là bản nháp; trong planning của chính task phải bổ sung check tập trung cho từng AC (lệnh, inputs, criterionIds) trước khi ready.
  - _Why:_ Review trước implement: một check chung pnpm lint/typecheck/test không chứng minh được các AC định lượng (token, churn, số hệ sinh thái).

## Evidence

_None recorded yet._
