# Đồng bộ PRD, WORKFLOW, PLAN và README với hợp đồng thật

- **ID:** 20261101-082451-docs-contract-sync
- **Mode:** lite
- **Epic:** 20261101-082443-harnix-session-review
- **Status:** completed/finishing
- **Created:** 2026-11-01 08:24:43 +07:00
- **Updated:** 2026-11-02 00:27:28 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Đóng E5/E6/R1/R3/R4/R5/R10: tài liệu frozen lệch code về envelope lỗi của hidden workflow, breaker, tiêu chí bất biến và cờ `status`.

## Non-goals

- Không đổi frozen contract nếu chưa cập nhật PRD, workflow, migration và test trong cùng thay đổi.
- Không commit, branch, push hay publish.

## Relevant paths

- `AGENTS.md`
- `CHANGELOG.md`
- `README.md`
- `docs/HARNIX_PRD.md`
- `docs/HARNIX_WORKFLOW.md`
- `docs/IMPLEMENTATION_PLAN.md`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +42 / -0 |
| `README.md` | modified | +1 / -1 |
| `docs/HARNIX_PRD.md` | modified | +4 / -4 |
| `docs/HARNIX_WORKFLOW.md` | modified | +4 / -2 |
| `docs/IMPLEMENTATION_PLAN.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/cli-helpers.ts` | modified | +3 / -1 |
| `src/cli-hints.ts` | modified | +25 / -0 |
| `src/commands/archive.ts` | modified | +2 / -2 |
| `src/commands/audit.ts` | modified | +2 / -2 |
| `src/commands/checks.ts` | modified | +2 / -2 |
| `src/commands/context-report.ts` | modified | +2 / -2 |
| `src/commands/epic.ts` | modified | +27 / -4 |
| `src/commands/internal-context.ts` | modified | +7 / -22 |
| `src/commands/learning.ts` | modified | +2 / -2 |
| `src/commands/pause.ts` | modified | +2 / -2 |
| `src/commands/repo-map-internal.ts` | modified | +2 / -2 |
| `src/commands/resume.ts` | modified | +4 / -12 |
| `src/commands/status.ts` | modified | +9 / -19 |
| `src/commands/tasks.ts` | modified | +2 / -2 |
| `src/commands/workflow-flags.ts` | modified | +19 / -6 |
| `src/core/context/session-cache.ts` | added | - |
| `src/core/epics/epic-location.ts` | modified | +9 / -0 |
| `src/core/epics/epic.ts` | modified | +3 / -2 |
| `src/core/global/setup.ts` | modified | +1 / -1 |
| `src/core/spec/project-skills.ts` | modified | +4 / -0 |
| `src/core/stack/verify-detection.ts` | modified | +5 / -10 |
| `src/core/stack/workspace-detection.ts` | modified | +4 / -9 |
| `src/core/tasks/read-tracker.ts` | modified | +6 / -2 |
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
| `src/utils/atomic-write.ts` | modified | +26 / -2 |
| `src/utils/project-discovery.ts` | modified | +8 / -0 |
| `src/utils/safe-read.ts` | added | - |
| `src/utils/safe-slice.ts` | added | - |
| `test/integration/commands/workflow-command.test.ts` | modified | +6 / -12 |

_(18 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): `docs/HARNIX_PRD.md` không còn câu "không nhận public error envelope" và nêu hidden `workflow` cũng phát envelope lỗi `{ok:false,error}`, chỉ hook `context` im lặng (grep xác nhận).
- [x] `ac-2` (met): PRD nêu cả ba lối thoát breaker (digest mới, `--reset-breaker`, `--replace-check`) ở mọi đoạn mô tả breaker, và PRD, WORKFLOW, PLAN không còn nói criterion đã có evidence là bất biến mà nêu `--set-criterion --reason` (passes thành stale) khớp `schema.ts` và `AGENTS.md` (grep xác nhận).
- [x] `ac-3` (met): README liệt kê đủ cờ của `harnix status --help` (`--explain`, `--summary`, `--criteria`, `--checks`, `--limit`, `--workspace`) và `pnpm run test:gates` cùng `pnpm run test` exit 0.

## Required checks

- [x] `chk-focused` (focused): Cổng hợp đồng và test tập trung — pass (2026-11-02 00:26:04 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án xanh — pass (2026-11-02 00:27:21 +07:00)

## Decisions

- **dec-readme** — README bảng lệnh status đã đủ cờ so với status --help, không sửa.
  - _Why:_ Đối chiếu harnix status --help: explain, summary, criteria, checks, limit, workspace đều có.

## Evidence

- `chk-focused` — pass (2026-11-02 00:26:04 +07:00): pnpm test:gates — exit 0
- `chk-suite` — pass (2026-11-02 00:27:21 +07:00): pnpm test — exit 0
