# Sửa ba điểm Low từ review epic upstream-review-fixes

- **ID:** 20261116-153941-review-followups-cwd-lint-inputs
- **Mode:** lite
- **Status:** completed/finishing
- **Created:** 2026-11-16 15:39:41 +07:00
- **Updated:** 2026-11-16 16:06:23 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Dùng lại normalizeCheckCwd cho cwd của suite, nhận diện formatter theo basename trong check-lint chỉ đọc, và thêm pnpm-workspace.yaml cùng *.slnx vào input mặc định.

## Relevant paths

- `src/core/workflow/init-default-inputs.ts`
- `src/core/workflow/init-lint-check.ts`
- `src/core/workflow/suite-command.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/core/workflow/init-default-inputs.ts` | modified | +2 / -1 |
| `src/core/workflow/init-lint-check.ts` | modified | +5 / -1 |
| `src/core/workflow/suite-command.ts` | modified | +11 / -4 |
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
| `test/unit/core/workflow/init-default-inputs.test.ts` | modified | +2 / -0 |
| `test/unit/core/workflow/init-lint-check.test.ts` | modified | +11 / -0 |
| `test/unit/core/workflow/suite-command.test.ts` | modified | +16 / -1 |

## Acceptance criteria

- [x] `ac-1` (met): normalizeSuiteCwd dùng lại normalizeCheckCwd và giữ nguyên cwd gốc khi nó ném lỗi, nên .. và đường dẫn tuyệt đối vẫn bị từ chối.
- [x] `ac-2` (met): Lệnh như ./node_modules/.bin/prettier -w . bị coi là ghi file (so basename của token formatter), còn pnpm -w run lint vẫn chỉ đọc.
- [x] `ac-3` (met): Sửa pnpm-workspace.yaml hoặc một file *.slnx ở gốc làm đổi digest của check suite mặc định.

## Required checks

- [x] `check-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-11-16 16:06:18 +07:00)
- [x] `check-focused` (focused): Test tập trung của ba điểm review — pass (2026-11-16 16:04:44 +07:00)

## Evidence

- `check-focused` — pass (2026-11-16 16:04:44 +07:00): pnpm exec vitest run test/unit/core/workflow/suite-command.test.ts test/unit/core/workflow/init-lint-check.test.ts test/unit/core/workflow/init-default-inputs.test.ts — exit 0
- `check-suite` — pass (2026-11-16 16:06:18 +07:00): pnpm test — exit 0
