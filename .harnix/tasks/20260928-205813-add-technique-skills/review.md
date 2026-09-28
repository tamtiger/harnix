# [15] Thư viện technique-skill hẹp (5–10, có bằng chứng) + extension point

- **ID:** 20260928-205813-add-technique-skills
- **Mode:** full
- **Status:** planning/planning
- **Created:** 2026-09-28T20:58:13.000+07:00
- **Updated:** 2026-09-28T20:58:28.000+07:00

**Verdict:** PENDING — 0/5 acceptance criteria met

## Goal

Không cố khớp số lượng 292 skill của ECC. Chỉ ship 5–10 technique-skill cross-language có bằng chứng từ research/external-research.md (verification-gap lens, bugfix 'must remain working', flaky-test diagnosis, migration-safety review, security-review lens) dạng SKILL.md chuẩn Agent Skills, cài qua skill sink của add-platform-registry, agent tự chọn theo mô tả, không qua stage routing. Mở .harnix/spec/skills/ làm extension point cho dự án tự thêm skill riêng; Harnix chỉ cung cấp cơ chế discover/cài đặt.

## Non-goals

- Không commit/push/PR tự động.
- Không đụng cấu hình user-global thật trong test.
- Không bump version trong task này; version 2.0.0 chỉ bump một lần ở release-v2 (quyết định người dùng 2026-09-28).
- Không viết skill domain nghiệp vụ hay meta-harness trùng máy móc nội bộ.

## Acceptance criteria

- `ac-bounded-count` (pending): Đúng 5–10 technique-skill được ship, mỗi skill trích dẫn bằng chứng cụ thể từ external-research.md.
- `ac-native-discovery` (pending): Technique-skill có frontmatter name/description chuẩn, được cài vào skill sink, không đi qua preflight.nextStage; test xác nhận không lẫn với 5 skill stage-owner.
- `ac-project-skill-ext` (pending): .harnix/spec/skills/ cho phép dự án tự thêm skill riêng; có fixture test.
- `ac-no-scope-creep` (pending): Không technique-skill nào trùng phạm vi guides hoặc 5 skill stage-owner.
- `ac-docs-sync` (pending): PRD/WORKFLOW/IMPLEMENTATION_PLAN (và README/skill liên quan) được cập nhật trong cùng task cho mọi contract mà task này đổi; không dồn sang release-v2.

## Required checks

- `check-suite` (focused): Toàn bộ lint, typecheck và mọi suite test pass (bản nháp, bổ sung check tập trung khi planning) — chưa chạy / not yet run

## Decisions

- **d-draft-checks** — check-suite là bản nháp; trong planning của chính task phải bổ sung check tập trung cho từng AC (lệnh, inputs, criterionIds) trước khi ready.
  - _Why:_ Review trước implement: một check chung pnpm lint/typecheck/test không chứng minh được các AC định lượng (token, churn, số hệ sinh thái).

## Evidence

_None recorded yet._
