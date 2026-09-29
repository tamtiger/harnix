# [09] Phát hiện lệnh verify đa ngôn ngữ, workspace và suite gate

- **ID:** 20260928-205807-add-verify-detection
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-09-28 20:58:07 +07:00
- **Updated:** 2026-09-29 15:00:56 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Phát hiện deterministic lệnh test/lint/typecheck/format theo manifest + lockfile + task runner cho npm/pnpm/yarn/bun, uv/poetry/pip, cargo, go, gradle/maven, dotnet, composer, swift, flutter; nearest-manifest-wins cho monorepo; ghi vào config.yaml verify:; lệnh public verify-plan. Suite gate: ready yêu cầu ít nhất một check mức project lấy từ verify-plan với inputs phủ toàn bộ source và test; finish từ chối khi check đó không có pass với digest hiện hành. Harness chỉ phát hiện và kiểm tra evidence, không tự chạy lệnh.

## Non-goals

- Không commit/push/PR tự động.
- Không đụng cấu hình user-global thật trong test.
- Không bump version trong task này; version 2.0.0 chỉ bump một lần ở release-v2 (quyết định người dùng 2026-09-28).
- Không thực thi lệnh verify trong harness.

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-detect` (met): Fixture cho ≥ 8 hệ sinh thái sinh đúng lệnh verify.
- `ac-workspace` (met): Monorepo pnpm/Cargo/go.work/Maven modules sinh lệnh theo package.
- `ac-no-tests` (met): Repo không có test được báo rõ và phải khai báo check thay thế; không tính là pass.
- `ac-suite-gate` (met): Ready từ chối task thiếu check mức project phủ toàn bộ source+test; finish từ chối khi check đó không có pass với digest hiện hành; regression test tái hiện kịch bản task pause (check chỉ unit+integration) bị từ chối.
- `ac-docs-sync` (met): PRD/WORKFLOW/IMPLEMENTATION_PLAN (và README/skill liên quan) được cập nhật trong cùng task cho mọi contract mà task này đổi; không dồn sang release-v2.

## Required checks

- `check-suite` (focused): Toàn bộ lint, typecheck và mọi suite test pass (project suite gate) — pass (2026-09-29 14:59:54 +07:00)
- `check-detect-ecosystems` (focused): Phát hiện lệnh verify cho >= 8 hệ sinh thái — pass (2026-09-29 14:59:05 +07:00)
- `check-monorepo-workspaces` (focused): Phát hiện lệnh verify theo monorepo workspaces nearest-manifest-wins — pass (2026-09-29 15:00:16 +07:00)
- `check-no-tests-warning` (focused): Cảnh báo repo không có test và xử lý verify-plan — pass (2026-09-29 14:52:47 +07:00)
- `check-suite-gate` (focused): Suite gate từ chối ready thiếu project-level suite check và finish thiếu pass digest — pass (2026-09-29 14:50:00 +07:00)
- `check-docs-sync` (focused): Đồng bộ tài liệu hợp đồng và README/skill — pass (2026-09-29 14:44:00 +07:00)

## Decisions

- **d-draft-checks** — check-suite là bản nháp; trong planning của chính task phải bổ sung check tập trung cho từng AC (lệnh, inputs, criterionIds) trước khi ready.
  - _Why:_ Review trước implement: một check chung pnpm lint/typecheck/test không chứng minh được các AC định lượng (token, churn, số hệ sinh thái).

## Evidence

- pass (2026-09-29 14:15:00 +07:00): Migrated TaskRecord schema to v3 with explicit authorization.
- skipped (2026-09-29 14:16:00 +07:00): Task contract revised at persisted replan: Bổ sung các check kiểm thử tập trung cho từng tiêu chí chấp nhận theo quyết định planning d-draft-checks.
- skipped (2026-09-29 14:40:55 +07:00): Task contract revised at persisted replan: Cập nhật đường dẫn file test trong inputs và command khớp với cấu trúc test/unit/core/... theo test-structure.
- `check-detect-ecosystems` — pass (2026-09-29 14:59:05 +07:00): Unit tests pass for verify detection across >= 8 ecosystems after branch coverage addition. _(1 earlier rerun not shown; see task.json for full history)_
- `check-monorepo-workspaces` — pass (2026-09-29 15:00:16 +07:00): Unit tests pass for monorepo workspace detection after test additions. _(1 earlier rerun not shown; see task.json for full history)_
- `check-no-tests-warning` — pass (2026-09-29 14:52:47 +07:00): Unit tests pass for no-tests warning and verify-plan command after coverage tests added. _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite-gate` — pass (2026-09-29 14:50:00 +07:00): Unit tests pass for suite gate enforcement at ready and finish after complexity refactor. _(2 earlier reruns not shown; see task.json for full history)_
- `check-docs-sync` — pass (2026-09-29 14:44:00 +07:00): Unit tests pass for contract documentation synchronization.
- `check-suite` — pass (2026-09-29 14:59:54 +07:00): Full suite pass: lint, typecheck, and all test suites pass.
