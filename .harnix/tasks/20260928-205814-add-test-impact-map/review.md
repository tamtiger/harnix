# [16] Repo-map hướng test-impact

- **ID:** 20260928-205814-add-test-impact-map
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-09-28 20:58:14 +07:00
- **Updated:** 2026-10-02 08:28:08 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Đổi hướng repo-map: thêm cạnh code→test theo import và quy ước đặt tên; lệnh repo-map --tests <path>; skill implement/verify dùng nó để chạy test bị ảnh hưởng trước rồi mới chạy suite; bỏ ranker không dùng.

## Non-goals

- Không commit/push/PR tự động.
- Không đụng cấu hình user-global thật trong test.
- Không bump version trong task này; version 2.0.0 chỉ bump một lần ở release-v2 (quyết định người dùng 2026-09-28).
- Không thay thế suite gate: test bị ảnh hưởng chỉ là bước nhanh, check mức project vẫn bắt buộc.

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-tests-edge` (met): repo-map --tests trả đúng test bị ảnh hưởng trên fixture TS, Python, Go.
- `ac-skill-use` (met): Skill implement/verify hướng dẫn chạy test bị ảnh hưởng rồi suite package.
- `ac-docs-sync` (met): PRD/WORKFLOW/IMPLEMENTATION_PLAN (và README/skill liên quan) được cập nhật trong cùng task cho mọi contract mà task này đổi; không dồn sang release-v2.

## Required checks

- `check-suite` (full): Toàn bộ lint, typecheck và mọi suite test pass — pass (2026-10-02 08:27:39 +07:00)
- `check-tests-edge` (focused): repo-map --tests trả đúng test bị ảnh hưởng trên fixture TS, Python, Go — pass (2026-10-02 08:24:44 +07:00)
- `check-skill-use` (focused): Skill implement/verify hướng dẫn chạy test bị ảnh hưởng rồi suite package — pass (2026-10-02 08:24:50 +07:00)
- `check-docs-sync` (focused): Kiểm tra structure, architecture và các docs PRD/WORKFLOW/IMPLEMENTATION_PLAN đồng bộ — pass (2026-10-02 08:26:26 +07:00)

## Decisions

- **d-draft-checks** — check-suite là bản nháp; trong planning của chính task phải bổ sung check tập trung cho từng AC (lệnh, inputs, criterionIds) trước khi ready.
  - _Why:_ Review trước implement: một check chung pnpm lint/typecheck/test không chứng minh được các AC định lượng (token, churn, số hệ sinh thái).
- **d-version-rule** — Mỗi member task hoàn thành sẽ bump package lên 2.0.0-dev.x kế tiếp (2.0.0-dev.15) theo quyết định người dùng 2026-10-01
  - _Why:_ Ghi đè quyết định 2026-09-28 cho toàn bộ epic overhaul theo hướng dẫn mới trong AGENTS.md

## Evidence

- pass (2026-10-02 08:09:57 +07:00): Migrated TaskRecord schema to v3 with explicit authorization.
- skipped (2026-10-02 08:12:34 +07:00): Task contract revised at persisted replan: Bổ sung checks tập trung cho từng AC và hoàn thiện suite gate trước khi ready theo decision d-draft-checks
- skipped (2026-10-02 08:12:41 +07:00): Task contract revised at persisted replan: Bổ sung check tập trung cho ac-tests-edge theo decision d-draft-checks
- skipped (2026-10-02 08:12:45 +07:00): Task contract revised at persisted replan: Bổ sung check tập trung cho ac-skill-use theo decision d-draft-checks
- skipped (2026-10-02 08:12:51 +07:00): Task contract revised at persisted replan: Bổ sung check tập trung cho ac-docs-sync theo decision d-draft-checks
- `check-tests-edge` — pass (2026-10-02 08:24:44 +07:00): pnpm — exit 0
- `check-skill-use` — pass (2026-10-02 08:24:50 +07:00): pnpm — exit 0
- `check-docs-sync` — pass (2026-10-02 08:26:26 +07:00): pnpm — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-02 08:27:39 +07:00): pnpm — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
