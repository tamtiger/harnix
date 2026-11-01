# Chặn --run-check ghi pass khi check không khai command và làm save epic idempotent

- **ID:** 20261101-082445-run-check-command-gate
- **Mode:** full
- **Epic:** 20261101-082443-harnix-session-review
- **Status:** completed/finishing
- **Created:** 2026-11-01 08:24:43 +07:00
- **Updated:** 2026-11-01 23:38:44 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 2/2 met or waived |
| Required checks | 100% | 3/3 passed |
| Residual risks | 2 | r-set-criterion: low, r-doctor: low |

## Goal

Đóng khe hở A5/R1 (check không khai `command` vẫn nhận argv bất kỳ) và R7 (save epic lỗi giữa chừng để lại trạng thái dở).

## Non-goals

- Không đổi frozen contract nếu chưa cập nhật PRD, workflow, migration và test trong cùng thay đổi.
- Không commit, branch, push hay publish.

## Relevant paths

- `src/core/epics/epic.ts`
- `src/core/workflow/command-match.ts`
- `src/core/workflow/epic-members.ts`
- `src/core/workflow/run-check.ts`
- `src/core/workflow/run-checks.ts`
- `src/core/workflow/save.ts`
- `test/unit/core/workflow/epic-members.test.ts`
- `test/unit/core/workflow/run-check.test.ts`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +1 / -1 |
| `docs/HARNIX_PRD.md` | modified | +1 / -1 |
| `docs/HARNIX_WORKFLOW.md` | modified | +2 / -0 |
| `package.json` | modified | +1 / -1 |
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
| `test/integration/commands/workflow-command.test.ts` | modified | +6 / -12 |
| `test/unit/core/workflow/epic-replay.test.ts` | added | - |
| `test/unit/core/workflow/run-check.test.ts` | modified | +21 / -16 |

## Acceptance criteria

- [x] `ac-1` (met): `--run-check` từ chối ghi pass khi check bắt buộc không khai `command` (hint trỏ `--set-check <id> --command`) và khi argv khác lệnh đã khai (thông báo in lệnh đã khai); `--run-checks` giữ nguyên hành vi từ chối; `--evidence` thủ công không đổi.
- [x] `ac-2` (met): Chạy lại cùng envelope `--save` (có `epic`/`epicMembers`) sau khi `upsertEpic`/`renderEpicMarkdown` lỗi giữa chừng thì thành công, epic và members đủ (replay idempotent).

## Required checks

- [x] `chk-focused` (focused): Test tập trung run-check, run-checks, save, epic-members — pass (2026-11-01 23:36:26 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án xanh — pass (2026-11-01 23:38:04 +07:00)
- [x] `chk-gates` (focused): Cổng hợp đồng (docs, CLI, kiến trúc) — pass (2026-11-01 23:36:33 +07:00)

## Residual risks

- **r-set-criterion** (low) — Hai bước save của set-criterion có thể kẹt ready/ready (P3), ngoài phạm vi member này.
- **r-doctor** (low) — Không thêm doctor finding cho epic thiếu sau save lỗi; chỉ replay idempotent.

## Evidence

- `chk-focused` — pass (2026-11-01 23:36:26 +07:00): pnpm exec vitest run test/unit/core/workflow/run-check.test.ts test/unit/core/workflow/run-checks.test.ts test/unit/core/workflow/save.test.ts test/unit/core/workflow/epic-members.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-gates` — pass (2026-11-01 23:36:33 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-suite` — pass (2026-11-01 23:38:04 +07:00): pnpm test — exit 0
