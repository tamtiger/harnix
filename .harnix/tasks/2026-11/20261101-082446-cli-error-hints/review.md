# Mọi lỗi CLI hay gặp đều có hint nêu lệnh đúng

- **ID:** 20261101-082446-cli-error-hints
- **Mode:** full
- **Epic:** 20261101-082443-harnix-session-review
- **Status:** completed/finishing
- **Created:** 2026-11-01 08:24:43 +07:00
- **Updated:** 2026-11-01 23:48:50 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 7/7 met or waived |
| Required checks | 100% | 3/3 passed |
| Residual risks | 1 | r-scope: low |

## Goal

Đóng nhóm B1/H1–H8,H12,H15: lỗi chỉ có `message`, cờ giá trị bắt buộc nuốt token kế tiếp, lệnh/option lạ không có hint, id epic không liệt kê id hợp lệ.

## Non-goals

- Không đổi frozen contract nếu chưa cập nhật PRD, workflow, migration và test trong cùng thay đổi.
- Không commit, branch, push hay publish.

## Relevant paths

- `src/cli-helpers.ts`
- `src/cli-hints.ts`
- `src/cli-program.ts`
- `src/cli-workflow-commands.ts`
- `src/commands/epic.ts`
- `src/commands/pause.ts`
- `src/commands/repo-map-internal.ts`
- `src/commands/resume.ts`
- `src/commands/status.ts`
- `src/commands/workflow-command.ts`
- `src/commands/workflow-flags.ts`
- `src/core/epics/epic.ts`
- `src/utils/project-discovery.ts`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +12 / -0 |
| `README.md` | modified | +1 / -1 |
| `docs/HARNIX_PRD.md` | modified | +1 / -1 |
| `docs/HARNIX_WORKFLOW.md` | modified | +3 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/cli-helpers.ts` | modified | +3 / -1 |
| `src/cli-hints.ts` | modified | +25 / -0 |
| `src/commands/archive.ts` | modified | +2 / -2 |
| `src/commands/audit.ts` | modified | +2 / -2 |
| `src/commands/checks.ts` | modified | +2 / -2 |
| `src/commands/context-report.ts` | modified | +2 / -2 |
| `src/commands/learning.ts` | modified | +2 / -2 |
| `src/commands/pause.ts` | modified | +2 / -2 |
| `src/commands/repo-map-internal.ts` | modified | +2 / -2 |
| `src/commands/resume.ts` | modified | +2 / -2 |
| `src/commands/tasks.ts` | modified | +2 / -2 |
| `src/commands/workflow-flags.ts` | modified | +19 / -6 |
| `src/core/epics/epic.ts` | modified | +3 / -2 |
| `src/core/workflow/epic-replay.ts` | added | - |
| `src/core/workflow/run-check.ts` | modified | +18 / -5 |
| `src/core/workflow/save.ts` | modified | +2 / -0 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +2 / -2 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +1 / -1 |
| `src/utils/project-discovery.ts` | modified | +8 / -0 |
| `test/integration/commands/workflow-command.test.ts` | modified | +6 / -12 |
| `test/unit/cli-hints.test.ts` | modified | +19 / -0 |
| `test/unit/core/workflow/epic-replay.test.ts` | added | - |
| `test/unit/core/workflow/run-check.test.ts` | modified | +21 / -16 |
| `test/workflow/behavior-snapshot.golden.json` | modified | +1 / -1 |
| `test/workflow/cli-contract.test.ts` | modified | +36 / -0 |

## Acceptance criteria

- [x] `ac-1` (met): Các lỗi trong `workflow-flags.ts` (`--brief`/`--full` không hỗ trợ, `--set-baseline requires ...`, `workflow does not accept operands`) và `--format requires repo-map --query` trả JSON lỗi có `error.hint` nêu lệnh hoặc cờ đúng (test: bảng hint trong `test/workflow/cli-contract.test.ts`).
- [x] `ac-2` (met): Cờ nhận id (`--set-baseline`, `--set-check`, `--reset-breaker`, `--remove-decision/criterion/risk`) không nuốt cờ kế tiếp: `workflow --set-baseline --result pass` báo cờ nhận một id kèm hint "cờ giá trị nhận token kế tiếp làm giá trị" thay vì lỗi operands (test cụ thể trong cli-contract).
- [x] `ac-3` (met): Lệnh lạ (`harnix facts`) trả hint `harnix update`, lệnh lạ gần giống tên lệnh thật trả "Có phải ý bạn là ..."; `internal` (hook) giữ nguyên không hint; hợp đồng `{ok:false,error:{exitCode,message,hint?}}` không đổi (test: cli-hints.test.ts và cli-contract).
- [x] `ac-4` (met): `harnix epic <id sai>` trả `No epic found with ID ...` kèm hint liệt kê id epic hợp lệ qua `unknownIdError` (test: epic.test.ts).
- [x] `ac-5` (met): Lỗi "requires an initialized Harnix project" của pause, resume, repo-map, archive, audit, checks, learning, context report và tasks có hint nêu `harnix init`/thư mục dự án con đã khởi tạo (test: pause.test.ts, resume.test.ts và cli-contract cho repo-map).
- [x] `ac-6` (met): `harnix status foo` (thừa đối số) trả `error.hint` nêu `harnix status` không nhận đối số và cách dùng đúng (test: cli-contract).
- [x] `ac-7` (met): Golden `behavior-snapshot.golden.json` chỉ đổi đúng các chuỗi lỗi/hint mới và `pnpm run test:gates` thoát 0 (kiểm bằng chk-gates).

## Required checks

- [x] `chk-focused` (focused): Test tập trung của lỗi/hint CLI — pass (2026-11-01 23:45:07 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án xanh — pass (2026-11-01 23:48:43 +07:00)
- [x] `chk-gates` (focused): Cổng hợp đồng: cli-contract, docs, golden, kiến trúc — pass (2026-11-01 23:45:18 +07:00)

## Residual risks

- **r-scope** (low) — Ngoài phạm vi: `--limit` bị nuốt im lặng ở vài lệnh và mọi lỗi dùng exit 2 (có thể là hợp đồng, chưa kiểm docs); không đổi ở member này.

## Evidence

- `chk-focused` — pass (2026-11-01 23:45:07 +07:00): pnpm exec vitest run test/workflow/cli-contract.test.ts test/unit/cli-hints.test.ts test/integration/commands/workflow-flags.test.ts test/integration/commands/epic.test.ts test/integration/commands... — exit 0
- `chk-gates` — pass (2026-11-01 23:45:18 +07:00): pnpm test:gates — exit 0
- `chk-suite` — pass (2026-11-01 23:48:43 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
