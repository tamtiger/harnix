# Sửa hai điểm review của epic repo-map-usability

- **ID:** 20261117-100419-repo-map-review-fixes
- **Mode:** lite
- **Status:** completed/finishing
- **Created:** 2026-11-17 10:04:19 +07:00
- **Updated:** 2026-11-17 10:08:50 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 2/2 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

--source-only áp dụng cả ở nhánh fallback tham chiếu; PRD ghi đủ cờ repo-map mới

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +1 / -1 |
| `docs/HARNIX_PRD.md` | modified | +5 / -3 |
| `package.json` | modified | +1 / -1 |
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
| `test/unit/core/repo-map/service.test.ts` | modified | +14 / -0 |

## Acceptance criteria

- [x] `ac-1` (met): --query với --source-only không trả file documentation, manifest hay config ở nhánh fallback tham chiếu
- [x] `ac-2` (met): docs/HARNIX_PRD.md ghi --source-only, --offset và --outline <Name> trong cú pháp và mô tả repo-map

## Required checks

- [x] `check-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-11-17 10:08:43 +07:00)
- [x] `check-focused` (focused): Test service repo-map — pass (2026-11-17 10:07:05 +07:00)

## Evidence

- `check-focused` — pass (2026-11-17 10:07:05 +07:00): pnpm exec vitest run test/unit/core/repo-map/service.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-11-17 10:08:43 +07:00): pnpm test — exit 0
