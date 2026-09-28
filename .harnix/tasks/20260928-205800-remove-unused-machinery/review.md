# [02] Gỡ code chết và tính năng không được dùng

- **ID:** 20260928-205800-remove-unused-machinery
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-09-28T20:58:00.000+07:00
- **Updated:** 2026-09-28T15:08:09.610Z

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Go code khong co caller (src/migration/**, src/rules/rules.ts, src/templates/harnix/managed-workflow.ts, src/core/research.ts) cung test/docs tham chieu; gop public command checks/audit/context-report vao status --explain; giu suite tuong thich du lieu cu. GIU learning/promotion.ts. Go context-selection DA CHUYEN sang task simplify-task-contract vi trung may moc save/verify/digest ma task do viet lai.

## Non-goals

- Không commit/push/PR tự động.
- Không đụng cấu hình user-global thật trong test.
- Không bump version trong task này; version 2.0.0 chỉ bump một lần ở release-v2 (quyết định người dùng 2026-09-28).

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-removed` (met): Các module liệt kê bị gỡ cùng test, docs, skill tham chiếu; effective-context.ts, journal/learning*.ts, promotion.ts còn nguyên.
- `ac-compat` (met): Task va journal lich su van doc duoc boi status/tasks/roadmap, khong loi (context.json van doc duoc; viec go persistence context.json thuoc simplify-task-contract).
- `ac-status-explain` (met): status --explain trả đủ thông tin trước đây của checks/audit/context-report.
- `ac-migration-suite` (met): Sau khi gỡ src/migration/**, suite test:migration không rỗng: chuyển thành test tương thích dữ liệu cũ (đọc task v1/v2, task có context.json); test:acceptance vẫn pass.
- `ac-cli-breaking` (met): cli-contract.test cập nhật danh sách lệnh; CHANGELOG (mục chưa phát hành của 2.0.0) ghi breaking change và hướng dẫn chuyển sang status --explain.
- `ac-docs-sync` (met): PRD/WORKFLOW/IMPLEMENTATION_PLAN (và README/skill liên quan) được cập nhật trong cùng task cho mọi contract mà task này đổi; không dồn sang release-v2.

## Required checks

- `check-suite` (focused): typecheck + lint + test xanh sau khi go dead-code va gop status --explain — pass (2026-09-28T22:07:18.000+07:00)
- `check-legacy-compat` (focused): Suite tuong thich du lieu cu doc duoc task v1/v2 va context.json — pass (2026-09-28T22:07:19.000+07:00)
- `check-docs-sync` (focused): Docs khong con tham chieu harnix checks/audit nhu lenh rieng — pass (2026-09-28T22:07:20.000+07:00)

## Decisions

- **d-draft-checks** — check-suite là bản nháp; trong planning của chính task phải bổ sung check tập trung cho từng AC (lệnh, inputs, criterionIds) trước khi ready.
  - _Why:_ Review trước implement: một check chung pnpm lint/typecheck/test không chứng minh được các AC định lượng (token, churn, số hệ sinh thái).
- **d-move-context-selection** — Go context-selection (selection-freshness.ts, persistence context.json) chuyen tu task nay sang simplify-task-contract.
  - _Why:_ Task simplify-task-contract viet lai toan bo may save/verify/digest ma context-selection la mot phan; lam o hai task la double work va double risk.

## Evidence

- `check-suite` — pass (2026-09-28T22:07:18.000+07:00): typecheck + lint + test xanh: 80 file, 635 pass, 1 skip.
- `check-legacy-compat` — pass (2026-09-28T22:07:19.000+07:00): legacy-data-compat.test.ts pass: doc task v1, v2 + context.json.
- `check-docs-sync` — pass (2026-09-28T22:07:20.000+07:00): grep xac nhan khong con tham chieu harnix checks/audit nhu lenh rieng.
