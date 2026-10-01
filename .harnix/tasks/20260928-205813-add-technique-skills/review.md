# [15] Thư viện technique-skill hẹp (5–10, có bằng chứng) + extension point

- **ID:** 20260928-205813-add-technique-skills
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-09-28 20:58:13 +07:00
- **Updated:** 2026-10-01 21:55:44 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Không cố khớp số lượng 292 skill của ECC. Chỉ ship 5–10 technique-skill cross-language có bằng chứng từ research/external-research.md (verification-gap lens, bugfix 'must remain working', flaky-test diagnosis, migration-safety review, security-review lens) dạng SKILL.md chuẩn Agent Skills, cài qua skill sink của add-platform-registry, agent tự chọn theo mô tả, không qua stage routing. Mở .harnix/spec/skills/ làm extension point cho dự án tự thêm skill riêng; Harnix chỉ cung cấp cơ chế discover/cài đặt.

## Non-goals

- Không commit/push/PR tự động.
- Không đụng cấu hình user-global thật trong test.
- Không bump version trong task này; version 2.0.0 chỉ bump một lần ở release-v2 (quyết định người dùng 2026-09-28).
- Không viết skill domain nghiệp vụ hay meta-harness trùng máy móc nội bộ.

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-bounded-count` (met): Đúng 5–10 technique-skill được ship, mỗi skill trích dẫn bằng chứng cụ thể từ external-research.md.
- `ac-native-discovery` (met): Technique-skill có frontmatter name/description chuẩn, được cài vào skill sink, không đi qua preflight.nextStage; test xác nhận không lẫn với 5 skill stage-owner.
- `ac-project-skill-ext` (met): .harnix/spec/skills/ cho phép dự án tự thêm skill riêng; có fixture test.
- `ac-no-scope-creep` (met): Không technique-skill nào trùng phạm vi guides hoặc 5 skill stage-owner.
- `ac-docs-sync` (met): PRD/WORKFLOW/IMPLEMENTATION_PLAN (và README/skill liên quan) được cập nhật trong cùng task cho mọi contract mà task này đổi; không dồn sang release-v2.

## Required checks

- `check-suite` (full): Toan bo lint, typecheck va moi suite test pass — pass (2026-10-01 21:55:05 +07:00)
- `check-technique-skills` (focused): Kiem tra 5 technique-skill ve so luong, frontmatter, bang chung va khong lan stage-owner — pass (2026-10-01 21:53:31 +07:00)
- `check-project-skills-ext` (focused): Kiem tra extension point .harnix/spec/skills/ va discovery cua harnix skill — pass (2026-10-01 21:53:39 +07:00)
- `check-global-surface` (focused): Kiem tra globalSkillDesiredFiles va cac adapter cai dat du ca workflow va technique skills — pass (2026-10-01 21:43:48 +07:00)
- `check-docs-sync` (focused): Kiem tra tai lieu va hop dong skills dong bo — pass (2026-10-01 21:53:54 +07:00)

## Decisions

- **d-draft-checks** — check-suite là bản nháp; trong planning của chính task phải bổ sung check tập trung cho từng AC (lệnh, inputs, criterionIds) trước khi ready.
  - _Why:_ Review trước implement: một check chung pnpm lint/typecheck/test không chứng minh được các AC định lượng (token, churn, số hệ sinh thái).
- **d-technique-skills** — Trien khai 5 technique-skills doc lap va mo extension point project skills
  - _Why:_ Tuan thu nghiem ngat nghien cuu empirical va bao dam test-structure khong bi orphan

## Residual risks

- **r-project-skills** (low) — Cac custom skill can tuan thu dinh dang agent-skills frontmatter de duoc phat hien chinh xac

## Evidence

- pass (2026-10-01 21:25:36 +07:00): Migrated TaskRecord schema to v3 with explicit authorization.
- skipped (2026-10-01 21:28:09 +07:00): Task contract revised at persisted replan: Bo sung check tap trung cho cac tieu chi nghiem thu theo quyet dinh d-draft-checks
- skipped (2026-10-01 21:28:15 +07:00): Task contract revised at persisted replan: Bo sung check cho extension point .harnix/spec/skills/
- skipped (2026-10-01 21:28:23 +07:00): Task contract revised at persisted replan: Bo sung check cho viec cai dat global skills tren 6 platform
- skipped (2026-10-01 21:28:30 +07:00): Task contract revised at persisted replan: Bo sung check kiem tra dong bo tai lieu va ngan sach token skills
- skipped (2026-10-01 21:28:35 +07:00): Task contract revised at persisted replan: Cap nhat scope thanh full va input phu hop cho suite gate
- skipped (2026-10-01 21:29:01 +07:00): Task contract revised at persisted replan: Truyen repeatable --input cho suite gate
- skipped (2026-10-01 21:29:08 +07:00): Task contract revised at persisted replan: Chuan hoa input thanh repeatable flags
- skipped (2026-10-01 21:29:15 +07:00): Task contract revised at persisted replan: Chuan hoa input thanh repeatable flags
- skipped (2026-10-01 21:29:21 +07:00): Task contract revised at persisted replan: Chuan hoa input thanh repeatable flags
- skipped (2026-10-01 21:29:26 +07:00): Task contract revised at persisted replan: Chuan hoa input thanh repeatable flags
- `check-technique-skills` — pass (2026-10-01 21:53:31 +07:00): pnpm — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
- `check-project-skills-ext` — pass (2026-10-01 21:53:39 +07:00): pnpm — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-global-surface` — pass (2026-10-01 21:43:48 +07:00): pnpm — exit 0
- `check-docs-sync` — pass (2026-10-01 21:53:54 +07:00): pnpm — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-01 21:55:05 +07:00): pwsh.exe — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
