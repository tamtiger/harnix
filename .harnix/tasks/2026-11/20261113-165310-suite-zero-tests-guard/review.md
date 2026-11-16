# Check suite chạy 0 test không được tính là pass

- **ID:** 20261113-165310-suite-zero-tests-guard
- **Mode:** lite
- **Epic:** 20261113-165307-agent-feedback-hardening
- **Status:** completed/finishing
- **Created:** 2026-11-13 16:53:07 +07:00
- **Updated:** 2026-11-13 17:17:21 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 2/2 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Phát hiện đầu ra không có test nào chạy (dotnet, vitest, jest, pytest) và không ghi nhận đó là một lần pass đáng tin; cảnh báo ở cổng ready khi lệnh suite trỏ vào solution không có project test.

## Non-goals

- Không đổi frozen contract ngoài phạm vi member này.
- Không chặn lệnh của agent; chỉ nhắc hoặc cảnh báo.

## Relevant paths

- `src/core/stack/dotnet-projects.ts`
- `src/core/workflow/check-output.ts`
- `src/core/workflow/ready.ts`
- `src/core/workflow/run-check.ts`
- `src/core/workflow/suite-command.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +2 / -1 |
| `CHANGELOG.md` | modified | +18 / -0 |
| `README.md` | modified | +1 / -1 |
| `docs/HARNIX_PRD.md` | modified | +2 / -2 |
| `docs/HARNIX_WORKFLOW.md` | modified | +1 / -1 |
| `docs/IMPLEMENTATION_PLAN.md` | modified | +2 / -2 |
| `package.json` | modified | +1 / -1 |
| `src/commands/pretool-hint.ts` | modified | +29 / -1 |
| `src/commands/workflow-command.ts` | modified | +4 / -1 |
| `src/commands/workflow-handlers.ts` | modified | +1 / -1 |
| `src/configurators/claude.ts` | modified | +1 / -1 |
| `src/core/platform/facts.ts` | modified | +1 / -1 |
| `src/core/stack/dotnet-projects.ts` | modified | +9 / -1 |
| `src/core/workflow/actions.ts` | modified | +1 / -1 |
| `src/core/workflow/check-output.ts` | modified | +21 / -0 |
| `src/core/workflow/plan-sync.ts` | modified | +27 / -5 |
| `src/core/workflow/ready.ts` | modified | +13 / -1 |
| `src/core/workflow/run-check.ts` | modified | +6 / -1 |
| `src/core/workflow/schema.ts` | modified | +1 / -1 |
| `src/core/workflow/suite-command.ts` | modified | +27 / -1 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +2 / -2 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/references/cookbook-commands.md` | modified | +1 / -1 |
| `test/platform/claude-global.test.ts` | modified | +1 / -1 |
| `test/platform/settings-json-fidelity.test.ts` | modified | +3 / -3 |
| `test/unit/commands/pretool-hint.test.ts` | modified | +30 / -0 |
| `test/unit/core/workflow/check-output.test.ts` | modified | +22 / -1 |
| `test/unit/core/workflow/plan-sync.test.ts` | modified | +49 / -3 |
| `test/unit/core/workflow/run-check.test.ts` | modified | +12 / -0 |
| `test/unit/core/workflow/suite-command.test.ts` | modified | +15 / -1 |
| `test/workflow/behavior-snapshot.golden.json` | modified | +2 / -1 |

## Acceptance criteria

- [x] `ac-1` (met): Đầu ra thể hiện 0 test được chạy (ví dụ `No test is available`) khiến check không được ghi là pass và trả hint nêu lệnh khắc phục.
- [x] `ac-2` (met): Cổng ready cảnh báo (mức warning, không chặn) khi lệnh suite của solution không chứa project test.

## Required checks

- [x] `chk-1` (focused): Test tập trung của suite-zero-tests-guard — pass (2026-11-13 17:15:00 +07:00)
- [x] `chk-2` (full): Bộ test toàn dự án — pass (2026-11-13 17:16:29 +07:00)

## Evidence

- `chk-1` — pass (2026-11-13 17:15:00 +07:00): pnpm exec vitest run test/unit/core/workflow/check-output.test.ts test/unit/core/workflow/run-check.test.ts test/unit/core/workflow/suite-command.test.ts — exit 0
- `chk-2` — pass (2026-11-13 17:16:29 +07:00): pnpm test — exit 0
