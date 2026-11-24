# Sửa đăng ký reference runbook của harnix-exercise và kiểm bằng CLI build

- **ID:** 20261124-160101-fix-exercise-runbook-reference
- **Mode:** lite
- **Status:** completed/finishing
- **Created:** 2026-11-24 16:01:01 +07:00
- **Updated:** 2026-11-24 16:12:26 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Đăng ký references/runbook.md trong technique-skills.ts để harnix skill harnix-exercise --reference runbook chạy được, và chặn tái diễn bằng test chiều ngược cùng một check chạy thật bản build.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `scripts/exercise-skill-references.mjs` | added | - |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-exercise/SKILL.md` | modified | +1 / -1 |
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
| `src/skills/technique-skills.ts` | modified | +2 / -0 |
| `test/platform/codex-global.test.ts` | modified | +1 / -1 |
| `test/unit/skills/technique-skills.test.ts` | modified | +9 / -1 |
| `test/workflow/skill-reference-registration.test.ts` | added | - |

## Acceptance criteria

- [x] `ac-1` (met): harnix skill harnix-exercise --reference runbook, chạy bằng dist/cli.js đã build, thoát 0 và in nội dung mẫu exercise.md.
- [x] `ac-2` (met): Mọi file trong references/ của mọi skill đều được đăng ký trong catalog, có test đơn vị đòi điều đó.
- [x] `ac-3` (met): Một script chạy bản build thật spawn dist/cli.js cho mọi cặp skill và reference được nhắc trong nguồn skill và thoát 0 với nội dung không rỗng.

## Required checks

- [x] `check-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-11-24 16:12:17 +07:00)
- [x] `chk-focused` (focused): Test hợp đồng nhanh — pass (2026-11-24 16:10:04 +07:00)
- [x] `chk-exercise-cli` (focused): exercise: chạy bản build thật, dist/cli.js skill cho mọi reference được nhắc — pass (2026-11-24 16:09:53 +07:00)

## Evidence

- `chk-exercise-cli` — pass (2026-11-24 16:09:53 +07:00): mode: full. node scripts/exercise-skill-references.mjs chạy dist/cli.js thật cho mọi cặp skill và reference được nhắc, thoát 0; trước khi sửa cùng lệnh báo harnix-exercise --reference runbook: Unknown reference _(3 earlier reruns not shown; see task.json for full history)_
- `chk-focused` — pass (2026-11-24 16:10:04 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-11-24 16:12:17 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
