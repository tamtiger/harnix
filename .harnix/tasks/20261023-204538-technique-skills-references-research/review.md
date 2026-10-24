# Nghiên cứu Cẩm nang Chuyên sâu cho 6 Technique Skills và Thiết kế Cơ chế Reference Động

- **ID:** 20261023-204538-technique-skills-references-research
- **Mode:** lite
- **Epic:** 20261023-170406-enterprise-events-brief-defaults-and-multi-workspace
- **Status:** completed/finishing
- **Created:** 2026-10-23 20:45:38 +07:00
- **Updated:** 2026-10-23 21:28:49 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Khảo sát, nghiên cứu các mô hình kiến trúc & kinh nghiệm thực chiến để xây dựng đề cương cẩm nang/chuyên đề chuyên sâu (deep domain references) cho 6 technique skills (bugfix-preserve, flaky-test, migration-safety, security-lens, sequential-thinking, verification-gap) và chuẩn hóa cơ chế nạp references động qua CLI.

## Relevant paths

- `src/skills/technique-skills.ts`
- `test/unit/skills/technique-skills.test.ts`
- `test/workflow/instruction-budget.test.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +24 / -0 |
| `README.md` | modified | +24 / -24 |
| `package.json` | modified | +1 / -1 |
| `src/cli-helpers.ts` | modified | +1 / -1 |
| `src/commands/repo-map-internal.ts` | modified | +22 / -5 |
| `src/commands/workflow-command.ts` | modified | +1 / -0 |
| `src/commands/workflow-flag-owners.ts` | modified | +8 / -2 |
| `src/commands/workflow-flags.ts` | modified | +1 / -0 |
| `src/commands/workflow-handlers.ts` | modified | +2 / -0 |
| `src/core/config/config-schema.ts` | modified | +8 / -0 |
| `src/core/config/config-validate.ts` | modified | +20 / -0 |
| `src/core/repo-map/event-discovery.ts` | modified | +35 / -3 |
| `src/core/repo-map/event-matrix.ts` | modified | +100 / -6 |
| `src/core/workflow/transition.ts` | modified | +5 / -1 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/references/invariant-debugging.md` | added | - |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/references/concurrency-isolation.md` | added | - |
| `src/skills/harnix-implement/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-migration-safety/references/zero-downtime-evolution.md` | added | - |
| `src/skills/harnix-plan/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/references/injection-traversal-guardrails.md` | added | - |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/references/multi-step-tree-search.md` | added | - |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/references/verification-blindspots.md` | added | - |
| `src/skills/harnix-verify/SKILL.md` | modified | +1 / -1 |
| `src/skills/technique-skills.ts` | modified | +42 / -6 |
| `src/utils/bounded-input.ts` | modified | +8 / -1 |
| `test/integration/commands/workflow-flags.test.ts` | modified | +3 / -0 |
| `test/platform/codex-global.test.ts` | modified | +1 / -1 |
| `test/unit/commands/workflow-handlers.test.ts` | modified | +46 / -0 |
| `test/unit/core/repo-map/event-discovery.test.ts` | modified | +32 / -0 |
| `test/unit/core/repo-map/event-matrix.test.ts` | modified | +177 / -0 |
| `test/unit/skills/technique-skills.test.ts` | modified | +24 / -0 |
| `test/unit/utils/bounded-input.test.ts` | modified | +16 / -0 |
| `test/workflow/cli-contract.test.ts` | modified | +1 / -0 |

## Acceptance criteria

- [x] `ac-1` (met): Khảo sát và xây dựng đề cương chi tiết các cẩm nang chuyên sâu cho 6 technique skills (invariant debugging, concurrency isolation, zero-downtime evolution, injection/traversal guardrails, multi-step tree search, verification blindspots).
- [x] `ac-2` (met): Thiết kế cấu trúc thư mục references/ và cơ chế đăng ký trong src/skills/technique-skills.ts tương thích lệnh harnix skill <name> --reference <topic>.
- [x] `ac-3` (met): Đo lường tác động token budget theo test/workflow/instruction-budget.test.ts đảm bảo các skill và reference tối ưu ngữ cảnh.

## Required checks

- [x] `check-suite` (full): Toàn bộ test suite và test kỹ năng/references phải pass — pass (2026-10-23 21:28:34 +07:00)
- [x] `check-skills` (focused): Kiểm tra định dạng và reference của technique skills — pass (2026-10-23 21:23:28 +07:00)

## Evidence

- `check-skills` — pass (2026-10-23 21:23:28 +07:00): pnpm vitest run test/unit/skills/technique-skills.test.ts test/workflow/instruction-budget.test.ts — exit 0
- `check-suite` — pass (2026-10-23 21:28:34 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
