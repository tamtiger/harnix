# [06] Thiết lập chuẩn định dạng và lint cho toàn repo

- **ID:** 20260928-205804-enforce-code-style
- **Mode:** full
- **Status:** planning/planning
- **Created:** 2026-09-28T20:58:04.000+07:00
- **Updated:** 2026-09-28T20:58:28.000+07:00

**Verdict:** PENDING — 0/5 acceptance criteria met

## Goal

Hiện repo chưa có formatter (không có Prettier/Biome), ESLint chỉ bật bộ recommended cơ bản, và có nhiều dòng rất dài (task.ts 47 dòng > 160 ký tự, templates/harnix/workflow.ts 38, catalog.ts 31, doctor.ts 30). Thêm Prettier làm devDependency (printWidth 120) cùng eslint-config-prettier; format một lần toàn bộ src, test, scripts trong một thay đổi thuần định dạng; bật typescript-eslint recommendedTypeChecked, max-lines 300 cho mỗi file (có danh sách miễn trừ tạm thời ghi rõ task nào gỡ), complexity, no-floating-promises; thêm script format và format:check, đưa format:check vào lint gate.

## Non-goals

- Không commit/push/PR tự động.
- Không đụng cấu hình user-global thật trong test.
- Không bump version trong task này; version 2.0.0 chỉ bump một lần ở release-v2 (quyết định người dùng 2026-09-28).
- Không đổi hành vi; thay đổi định dạng tách riêng khỏi mọi thay đổi logic.
- Không tự cài package: pnpm add -D cần mạng, phải hỏi người dùng trước khi cài.

## Acceptance criteria

- `ac-formatter` (pending): Prettier và eslint-config-prettier được cấu hình; pnpm format:check pass trên toàn repo sau một lần format.
- `ac-lint-rules` (pending): ESLint bật recommendedTypeChecked, max-lines 300, complexity, no-floating-promises; pnpm lint pass; mọi vi phạm còn lại nằm trong danh sách miễn trừ tạm thời có ghi task chịu trách nhiệm gỡ.
- `ac-format-only` (pending): Diff của bước format chỉ thay đổi định dạng: pnpm test pass không sửa assertion và output CLI giữ nguyên.
- `ac-scripts` (pending): package.json có format và format:check; format:check nằm trong lint gate.
- `ac-docs-sync` (pending): PRD/WORKFLOW/IMPLEMENTATION_PLAN (và README/skill liên quan) được cập nhật trong cùng task cho mọi contract mà task này đổi; không dồn sang release-v2.

## Required checks

- `check-suite` (focused): Toàn bộ lint, typecheck và mọi suite test pass (bản nháp, bổ sung check tập trung khi planning) — chưa chạy / not yet run

## Decisions

- **d-draft-checks** — check-suite là bản nháp; trong planning của chính task phải bổ sung check tập trung cho từng AC (lệnh, inputs, criterionIds) trước khi ready.
  - _Why:_ Review trước implement: một check chung pnpm lint/typecheck/test không chứng minh được các AC định lượng (token, churn, số hệ sinh thái).

## Evidence

_None recorded yet._
