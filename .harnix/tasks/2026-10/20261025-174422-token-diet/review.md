# Tối ưu token: schema gọn mặc định, bỏ lặp cookbook, giảm skill sát trần, preflight bỏ khóa rỗng

- **ID:** 20261025-174422-token-diet
- **Mode:** full
- **Epic:** 20261025-174418-hardening-and-token-diet
- **Status:** completed/finishing
- **Created:** 2026-10-25 17:44:22 +07:00
- **Updated:** 2026-10-25 19:52:48 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 4/4 passed |

## Goal

Giảm token của một phiên Lite điển hình (baseline khoảng 10,8k) bằng cách bỏ khối transports khỏi --schema mặc định, gộp cookbook lặp giữa workflow.md và reference, chuyển phần ít dùng của skill sát trần sang reference và bỏ khóa rỗng ở preflight, kèm test bảo vệ nội dung bắt buộc. Là member dev.3; task improve-test-speed là member cuối theo ID và đóng epic.

## Non-goals

- Không làm yếu gate hay bỏ nội dung bắt buộc của skill
- Không đổi contract field đóng băng

## Relevant paths

- `src/core/workflow/schema.ts`
- `src/templates/harnix/workflow.md`
- `src/skills/harnix-plan/SKILL.md`
- `src/skills/harnix-verify/SKILL.md`
- `src/skills/harnix-implement/SKILL.md`
- `src/core/workflow/preflight.ts`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +6 / -6 |
| `CHANGELOG.md` | modified | +24 / -0 |
| `README.md` | modified | +2 / -2 |
| `docs/HARNIX_PRD.md` | modified | +1 / -1 |
| `docs/HARNIX_WORKFLOW.md` | modified | +8 / -0 |
| `package.json` | modified | +1 / -1 |
| `scripts/measure-tokens.mjs` | modified | +18 / -1 |
| `src/cli-helpers.ts` | modified | +13 / -3 |
| `src/cli-hints.ts` | added | - |
| `src/cli-program.ts` | modified | +7 / -6 |
| `src/cli-workflow-commands.ts` | modified | +2 / -2 |
| `src/commands/epic.ts` | modified | +5 / -2 |
| `src/commands/learning.ts` | modified | +2 / -1 |
| `src/commands/skills.ts` | modified | +7 / -1 |
| `src/commands/status.ts` | modified | +5 / -4 |
| `src/commands/workflow-command.ts` | modified | +2 / -1 |
| `src/commands/workflow-flag-owners.ts` | modified | +12 / -27 |
| `src/commands/workflow-flags.ts` | modified | +30 / -48 |
| `src/commands/workflow-handlers.ts` | modified | +6 / -2 |
| `src/core/doctor/restore-artifacts.ts` | modified | +2 / -1 |
| `src/core/global/reconcile.ts` | modified | +1 / -0 |
| `src/core/journal/learning-safety.ts` | modified | +42 / -10 |
| `src/core/managed/decision.ts` | modified | +5 / -2 |
| `src/core/managed/project-files.ts` | modified | +4 / -0 |
| `src/core/repo-map/store.ts` | modified | +1 / -1 |
| `src/core/stack/verify-plan.ts` | modified | +4 / -6 |
| `src/core/tasks/read-tracker.ts` | added | - |
| `src/core/tasks/task-store.ts` | modified | +4 / -1 |
| `src/core/workflow/actions.ts` | added | - |
| `src/core/workflow/baseline.ts` | modified | +7 / -1 |
| `src/core/workflow/brief.ts` | modified | +5 / -30 |
| `src/core/workflow/completion.ts` | modified | +13 / -1 |
| `src/core/workflow/criterion.ts` | modified | +8 / -1 |
| `src/core/workflow/evidence-flags.ts` | modified | +8 / -1 |
| `src/core/workflow/index.ts` | modified | +1 / -1 |
| `src/core/workflow/plan-edit.ts` | modified | +7 / -1 |
| `src/core/workflow/plan-remove.ts` | modified | +21 / -3 |
| `src/core/workflow/replace-check.ts` | modified | +8 / -1 |
| `src/core/workflow/reset-breaker.ts` | modified | +11 / -4 |
| `src/core/workflow/run-check.ts` | modified | +8 / -1 |
| `src/core/workflow/run-checks.ts` | modified | +4 / -1 |
| `src/core/workflow/save.ts` | modified | +44 / -2 |
| `src/core/workflow/schema.ts` | modified | +12 / -1 |
| `src/core/workflow/set-criterion.ts` | modified | +7 / -1 |
| `src/core/workflow/text-integrity.ts` | modified | +6 / -2 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +1 / -1 |

_(50 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): workflow --schema mặc định không in khối transports; có cờ để in đầy đủ; tiết kiệm tối thiểu 1.200 token
- [x] `ac-2` (met): Cookbook không còn lặp giữa .harnix/workflow.md và reference cookbook-commands, tổng giảm tối thiểu 400 token
- [x] `ac-3` (met): Mỗi SKILL.md không vượt 1.800 token và các mục bắt buộc vẫn có test bảo vệ
- [x] `ac-4` (met): measure:tokens xuất thêm trường sessionLite (alwaysLoaded, workflowDoc, schema, skill harnix-plan và harnix-implement, preflight planning, hookContext planning) và trường này giảm tối thiểu 1.800 token so với số đo ghi lúc bắt đầu task

## Required checks

- [x] `chk-tokens` (focused): Test ngân sách token, nội dung bắt buộc và số đo phiên — pass (2026-10-25 19:50:34 +07:00)
- [x] `chk-gates` (focused): Các contract test (CLI, docs, golden) — pass (2026-10-25 19:50:41 +07:00)
- [x] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-25 19:52:38 +07:00)
- [x] `chk-schema` (focused): Test schema gọn mặc định và cờ in đầy đủ — pass (2026-10-25 19:50:45 +07:00)

## Decisions

- **dec-late-transition** — Code của token-diet được viết khi task còn ở planning; trạng thái ready và in_progress được bổ sung ngay khi phát hiện, trước khi verify
  - _Why:_ Ghi vết trung thực việc làm sai thứ tự quy trình để người dùng thấy trong review.md
- **dec-token-measure** — Số đo measure:tokens sau thay đổi: sessionLite 11.088 xuống 9.240 (giảm 1.848), --schema 2.491 xuống 877 (giảm 1.614), cookbook giảm 620 token trên workflow.md và reference, harnix-plan SKILL.md 1.794 token
  - _Why:_ Các check chỉ kiểm exit code, nên số đo tiết kiệm token được ghi làm vết để đối chiếu tiêu chí ac-1, ac-2, ac-4

## Evidence

- `chk-tokens` — pass (2026-10-25 19:50:34 +07:00): pnpm exec vitest run test/unit/skills test/workflow/lean-workflow.test.ts test/workflow/measure-tokens.test.ts — exit 0
- `chk-gates` — pass (2026-10-25 19:50:41 +07:00): pnpm test:gates — exit 0
- `chk-schema` — pass (2026-10-25 19:50:45 +07:00): pnpm exec vitest run test/unit/core/workflow/schema.test.ts — exit 0
- `check-suite` — pass (2026-10-25 19:52:38 +07:00): pnpm test — exit 0
