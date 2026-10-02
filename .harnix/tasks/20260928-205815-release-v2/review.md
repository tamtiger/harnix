# [17] Tinh gọn gate phát hành, rà nhất quán docs và phát hành 2.0.0

- **ID:** 20260928-205815-release-v2
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-09-28 20:58:15 +07:00
- **Updated:** 2026-10-02 11:41:02 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Bỏ chạy trùng trong test:acceptance, rà 17 script; rà nhất quán lần cuối PRD/WORKFLOW/IMPLEMENTATION_PLAN/README (các task trước đã tự cập nhật docs của mình); bump version 2.0.0 một lần qua pnpm version:sync và viết một entry CHANGELOG tổng hợp toàn bộ epic, gồm các breaking change; chạy đủ acceptance sequence ở docs/IMPLEMENTATION_PLAN.md section 11 cùng fake-home tarball smoke.

## Non-goals

- Không commit/push/PR tự động.
- Không đụng cấu hình user-global thật trong test.

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-gates` (met): Acceptance sequence không chạy lại cùng test hai lần và tổng thời gian giảm so với hiện tại.
- `ac-docs-consistency` (met): PRD/WORKFLOW/IMPLEMENTATION_PLAN/README nhất quán với sản phẩm sau đại tu; không còn tham chiếu tới thành phần đã gỡ.
- `ac-version-2` (met): package.json và mọi nơi đồng bộ version là 2.0.0; CHANGELOG có đúng một entry 2.0.0 liệt kê breaking change và hướng dẫn migrate.
- `ac-acceptance` (met): Acceptance sequence section 11 (gồm format:check và coverage floor) và fake-home tarball smoke pass với evidence mới.
- `ac-managed-output` (met): Sau khi bump 2.0.0, .harnix/workflow.md và .harnix/.template-hashes.json được sinh lại (generatorVersion 2.0.0) và self-host test pass.
- `ac-no-exemptions` (met): Danh sách miễn trừ max-lines trống; mọi file trong src ≤ 300 dòng.

## Required checks

- `check-suite` (full): Acceptance sequence section 11 va fake-home tarball smoke pass — pass (2026-10-02 11:39:29 +07:00)
- `check-no-exemptions` (focused): Danh sach mien tru max-lines trong va moi file src <= 300 dong — pass (2026-10-02 11:36:27 +07:00)
- `check-gates` (focused): Acceptance sequence khong chay trung va thoi gian toi uu — pass (2026-10-02 11:39:48 +07:00)
- `check-docs-consistency` (focused): PRD, WORKFLOW, IMPLEMENTATION_PLAN, README dong bo nhat quan — pass (2026-10-02 11:34:57 +07:00)
- `check-version-2` (focused): package.json va moi noi dong bo version 2.0.0 va CHANGELOG hop nhat — pass (2026-10-02 11:36:06 +07:00)
- `check-managed-output` (focused): Sau khi bump 2.0.0, .harnix/workflow.md va .template-hashes.json duoc sinh lai va self-host pass — pass (2026-10-02 11:36:15 +07:00)

## Decisions

- **d-draft-checks** — check-suite là bản nháp; trong planning của chính task phải bổ sung check tập trung cho từng AC (lệnh, inputs, criterionIds) trước khi ready.
  - _Why:_ Review trước implement: một check chung pnpm lint/typecheck/test không chứng minh được các AC định lượng (token, churn, số hệ sinh thái).
- **dec-1** — Go bo hoan toan moi danh sach mien tru trong ESLint va tach module src/ va scripts/ de moi file <= 300 dong
  - _Why:_ Bao dam tinh ran de cua architecture test va duy tri codebase sach se cho v2.0.0
- **dec-2** — Gop cac entry dev tam thoi trong CHANGELOG thanh mot entry 2.0.0 duy nhat
  - _Why:_ Tao changelog tong ket ro rang de tra cuu cho nguoi dung cuoi va platform

## Residual risks

- **rsk-1** (low) — Can nguoi dung duyet commit truoc khi phat hanh hoac push

## Evidence

- pass (2026-10-02 10:42:13 +07:00): Migrated TaskRecord schema to v3 with explicit authorization.
- skipped (2026-10-02 10:43:55 +07:00): Task contract revised at persisted replan: Thiet lap check tap trung cho ac-no-exemptions
- skipped (2026-10-02 10:44:01 +07:00): Task contract revised at persisted replan: Thiet lap check tap trung cho ac-gates
- skipped (2026-10-02 10:44:07 +07:00): Task contract revised at persisted replan: Thiet lap check tap trung cho ac-docs-consistency
- skipped (2026-10-02 10:44:12 +07:00): Task contract revised at persisted replan: Thiet lap check tap trung cho ac-version-2
- skipped (2026-10-02 10:44:23 +07:00): Task contract revised at persisted replan: Thiet lap check tap trung cho ac-managed-output
- skipped (2026-10-02 10:44:36 +07:00): Task contract revised at persisted replan: Cap nhat check-suite thanh check-acceptance phu toan bo repo cho ac-acceptance
- `check-gates` — pass (2026-10-02 11:39:48 +07:00): pnpm — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-docs-consistency` — pass (2026-10-02 11:34:57 +07:00): pnpm — exit 0
- `check-version-2` — pass (2026-10-02 11:36:06 +07:00): pnpm — exit 0
- `check-managed-output` — pass (2026-10-02 11:36:15 +07:00): pnpm — exit 0
- `check-no-exemptions` — pass (2026-10-02 11:36:27 +07:00): pnpm — exit 0
- `check-suite` — pass (2026-10-02 11:39:29 +07:00): pnpm — exit 0
