# [06] Thiết lập chuẩn định dạng và lint cho toàn repo

- **ID:** 20260928-205804-enforce-code-style
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-09-28 20:58:04 +07:00
- **Updated:** 2026-09-29 11:10:24 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Hiện repo chưa có formatter (không có Prettier/Biome), ESLint chỉ bật bộ recommended cơ bản, và có nhiều dòng rất dài (task.ts 47 dòng > 160 ký tự, templates/harnix/workflow.ts 38, catalog.ts 31, doctor.ts 30). Thêm Prettier làm devDependency (printWidth 120) cùng eslint-config-prettier; format một lần toàn bộ src, test, scripts trong một thay đổi thuần định dạng; bật typescript-eslint recommendedTypeChecked, max-lines 300 cho mỗi file (có danh sách miễn trừ tạm thời ghi rõ task nào gỡ), complexity, no-floating-promises; thêm script format và format:check, đưa format:check vào lint gate.

## Non-goals

- Không commit/push/PR tự động.
- Không đụng cấu hình user-global thật trong test.
- Không bump version trong task này; version 2.0.0 chỉ bump một lần ở release-v2 (quyết định người dùng 2026-09-28).
- Không đổi hành vi; thay đổi định dạng tách riêng khỏi mọi thay đổi logic.
- Không tự cài package: pnpm add -D cần mạng, phải hỏi người dùng trước khi cài.

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-formatter` (met): Prettier và eslint-config-prettier được cấu hình; pnpm format:check pass trên toàn repo sau một lần format.
- `ac-lint-rules` (met): ESLint bật recommendedTypeChecked, max-lines 300, complexity, no-floating-promises; pnpm lint pass; mọi vi phạm còn lại nằm trong danh sách miễn trừ tạm thời có ghi task chịu trách nhiệm gỡ.
- `ac-format-only` (met): Diff của bước format chỉ thay đổi định dạng: pnpm test pass không sửa assertion và output CLI giữ nguyên.
- `ac-scripts` (met): package.json có format và format:check; format:check nằm trong lint gate.
- `ac-docs-sync` (met): PRD/WORKFLOW/IMPLEMENTATION_PLAN (và README/skill liên quan) được cập nhật trong cùng task cho mọi contract mà task này đổi; không dồn sang release-v2.

## Required checks

- `check-docs-sync` (focused): Test parity docs, script và cấu hình định dạng pass — pass (2026-09-29 11:10:02 +07:00)
- `check-format` (focused): pnpm format:check pass trên toàn repo — pass (2026-09-29 11:10:03 +07:00)
- `check-lint-rules` (focused): ESLint với luật mới pass, vi phạm còn lại nằm trong danh sách miễn trừ — pass (2026-09-29 11:10:04 +07:00)
- `check-suite` (full): Toàn bộ lint, typecheck và mọi suite test pass — pass (2026-09-29 11:10:05 +07:00)

## Decisions

- **d-install-approved** — prettier và eslint-config-prettier được cài bằng pnpm add -D sau khi người dùng cho phép rõ ràng ngày 2026-09-29.
  - _Why:_ Task cấm tự cài package vì cần mạng; đã hỏi và được duyệt.
- **d-eol-auto** — Prettier dùng endOfLine auto.
  - _Why:_ Working tree Windows có file CRLF lẫn LF do autocrlf; ép một kiểu sẽ đổi mọi dòng và phá diff chỉ định dạng.
- **d-exempt-list** — Vi phạm max-lines/complexity/type-checked chưa sửa cơ học được nằm trong danh sách miễn trừ tường minh trong eslint.config.mjs, mỗi nhóm ghi task chịu trách nhiệm gỡ.
  - _Why:_ Sửa cấu trúc thuộc restructure-code và standardize-tests; task này không đổi hành vi hay tách module.

## Evidence

- pass (2026-09-29 11:01:59 +07:00): Migrated TaskRecord schema to v3 with explicit authorization.
- skipped (2026-09-29 11:02:00 +07:00): Task contract revised at persisted replan: Bổ sung check tập trung cho từng tiêu chí và ghi lại quyết định cài package sau khi được người dùng cho phép.
- `check-docs-sync` — pass (2026-09-29 11:10:02 +07:00): Check check-docs-sync passed (exit 0):    Start at  11:08:57 |    Duration  1.05s (transform 283ms, setup 0ms, collect 680ms, tests 60ms, e
- `check-format` — pass (2026-09-29 11:10:03 +07:00): Check check-format passed (exit 0): $ prettier --check "src/**/*.ts" "test/**/*.ts" "scripts/**/*.mjs" eslint.config.mjs tsup.config.ts 
- `check-lint-rules` — pass (2026-09-29 11:10:04 +07:00): Check check-lint-rules passed (exit 0): 
- `check-suite` — pass (2026-09-29 11:10:05 +07:00): Check check-suite passed (exit 0):    Start at  11:09:34 |    Duration  17.76s (transform 4.38s, setup 0ms, collect 35.76s, tests 100.0
- pass (2026-09-29 11:10:06 +07:00): Sau prettier --write, bản build tsup của toàn bộ dist khi minify bằng esbuild giống hệt bản trước khi format (527596 ký tự); typecheck sạch, 679 test pass không sửa assertion.
