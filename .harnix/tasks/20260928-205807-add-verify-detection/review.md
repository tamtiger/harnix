# [09] Phát hiện lệnh verify đa ngôn ngữ, workspace và suite gate

- **ID:** 20260928-205807-add-verify-detection
- **Mode:** full
- **Status:** planning/planning
- **Created:** 2026-09-28T20:58:07.000+07:00
- **Updated:** 2026-09-28T20:58:28.000+07:00

**Verdict:** PENDING — 0/5 acceptance criteria met

## Goal

Phát hiện deterministic lệnh test/lint/typecheck/format theo manifest + lockfile + task runner cho npm/pnpm/yarn/bun, uv/poetry/pip, cargo, go, gradle/maven, dotnet, composer, swift, flutter; nearest-manifest-wins cho monorepo; ghi vào config.yaml verify:; lệnh public verify-plan. Suite gate: ready yêu cầu ít nhất một check mức project lấy từ verify-plan với inputs phủ toàn bộ source và test; finish từ chối khi check đó không có pass với digest hiện hành. Harness chỉ phát hiện và kiểm tra evidence, không tự chạy lệnh.

## Non-goals

- Không commit/push/PR tự động.
- Không đụng cấu hình user-global thật trong test.
- Không bump version trong task này; version 2.0.0 chỉ bump một lần ở release-v2 (quyết định người dùng 2026-09-28).
- Không thực thi lệnh verify trong harness.

## Acceptance criteria

- `ac-detect` (pending): Fixture cho ≥ 8 hệ sinh thái sinh đúng lệnh verify.
- `ac-workspace` (pending): Monorepo pnpm/Cargo/go.work/Maven modules sinh lệnh theo package.
- `ac-no-tests` (pending): Repo không có test được báo rõ và phải khai báo check thay thế; không tính là pass.
- `ac-suite-gate` (pending): Ready từ chối task thiếu check mức project phủ toàn bộ source+test; finish từ chối khi check đó không có pass với digest hiện hành; regression test tái hiện kịch bản task pause (check chỉ unit+integration) bị từ chối.
- `ac-docs-sync` (pending): PRD/WORKFLOW/IMPLEMENTATION_PLAN (và README/skill liên quan) được cập nhật trong cùng task cho mọi contract mà task này đổi; không dồn sang release-v2.

## Required checks

- `check-suite` (focused): Toàn bộ lint, typecheck và mọi suite test pass (bản nháp, bổ sung check tập trung khi planning) — chưa chạy / not yet run

## Decisions

- **d-draft-checks** — check-suite là bản nháp; trong planning của chính task phải bổ sung check tập trung cho từng AC (lệnh, inputs, criterionIds) trước khi ready.
  - _Why:_ Review trước implement: một check chung pnpm lint/typecheck/test không chứng minh được các AC định lượng (token, churn, số hệ sinh thái).

## Evidence

_None recorded yet._
