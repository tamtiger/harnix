# Rà soát và bổ sung help cho toàn bộ lệnh CLI

- **ID:** 20261031-103634-cli-help-audit
- **Mode:** lite
- **Status:** completed/finishing
- **Created:** 2026-10-31 10:36:34 +07:00
- **Updated:** 2026-10-31 10:42:13 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 1/1 met or waived |
| Required checks | 100% | 1/1 passed |

## Goal

Hiện --refresh của repo-map và mô tả/tùy chọn của mọi lệnh public trong harnix --help

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +28 / -28 |
| `docs/HARNIX_PRD.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/cli-project-commands.ts` | modified | +12 / -1 |
| `src/cli-workflow-commands.ts` | modified | +9 / -6 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +1 / -1 |
| `test/unit/cli-workflow-commands.test.ts` | modified | +22 / -0 |
| `test/workflow/cli-contract.test.ts` | modified | +1 / -1 |

## Acceptance criteria

- [x] `ac-1` (met): harnix repo-map --help liệt kê --refresh; mọi lệnh public có mô tả và mọi tùy chọn có mô tả

## Required checks

- [x] `check-1` (focused): Kiểm chứng: Rà soát và bổ sung help cho toàn bộ lệnh CLI — pass (2026-10-31 10:41:39 +07:00)

## Evidence

- `check-1` — pass (2026-10-31 10:41:39 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
