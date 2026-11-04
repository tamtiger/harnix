# Doctor gộp finding journal lặp theo file

- **ID:** 20261104-112540-doctor-journal-finding-dedupe
- **Mode:** lite
- **Epic:** 20261104-112537-session-friction-fixes
- **Status:** completed/finishing
- **Created:** 2026-11-04 11:25:37 +07:00
- **Updated:** 2026-11-04 13:46:59 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 2/2 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Doctor phát một finding cho mỗi dòng journal nên một file có thể sinh hàng chục dòng giống hệt nhau (13 journal-task-unlinked cho ba file); gộp theo (mã, file) kèm số bản ghi để báo cáo gọn mà không mất thông tin.

## Relevant paths

- `src/core/doctor/project-tasks.ts`
- `docs/HARNIX_PRD.md`
- `CHANGELOG.md`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -1 |
| `CHANGELOG.md` | modified | +12 / -0 |
| `README.md` | modified | +1 / -1 |
| `docs/HARNIX_PRD.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/core/doctor/project-tasks.ts` | modified | +26 / -20 |
| `src/core/workflow/batch.ts` | modified | +2 / -1 |
| `src/core/workflow/cancel.ts` | modified | +2 / -1 |
| `src/core/workflow/criterion.ts` | modified | +2 / -1 |
| `src/core/workflow/evidence-flags.ts` | modified | +2 / -1 |
| `src/core/workflow/evidence.ts` | modified | +2 / -1 |
| `src/core/workflow/finish.ts` | modified | +5 / -2 |
| `src/core/workflow/learn.ts` | modified | +2 / -1 |
| `src/core/workflow/migrate-v3.ts` | modified | +2 / -1 |
| `src/core/workflow/no-active-task.ts` | added | - |
| `src/core/workflow/plan-edit.ts` | modified | +2 / -1 |
| `src/core/workflow/plan-sync.ts` | modified | +2 / -1 |
| `src/core/workflow/reset-breaker.ts` | modified | +2 / -1 |
| `src/core/workflow/run-check.ts` | modified | +2 / -1 |
| `src/core/workflow/run-checks.ts` | modified | +2 / -1 |
| `src/core/workflow/snapshot.ts` | modified | +2 / -1 |
| `src/core/workflow/transition-hints.ts` | added | - |
| `src/core/workflow/transition.ts` | modified | +5 / -1 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +2 / -2 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +2 / -2 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/references/gates.md` | modified | +1 / -1 |
| `src/templates/harnix/workflow.md` | modified | +1 / -1 |
| `test/support/builders.ts` | modified | +12 / -0 |
| `test/unit/core/doctor/archived-tasks.test.ts` | modified | +2 / -11 |
| `test/unit/core/doctor/project-tasks.test.ts` | modified | +54 / -5 |
| `test/unit/core/workflow/finish.test.ts` | modified | +1 / -1 |
| `test/unit/core/workflow/no-active-task.test.ts` | added | - |
| `test/unit/core/workflow/transition-hints.test.ts` | added | - |
| `test/workflow/builders.test.ts` | added | - |
| `test/workflow/docs-task-contract.test.ts` | modified | +3 / -0 |

## Acceptance criteria

- [x] `ac-1` (met): Với journal-task-unlinked và journal-evidence-unlinked, doctor phát tối đa một finding cho mỗi (mã, file journal), message nêu số bản ghi bị ảnh hưởng; mã, severity, path và exit code không đổi, fixture hiện có của danh mục mã vẫn pass, và journal sạch vẫn không sinh finding.
- [x] `ac-2` (met): docs/HARNIX_PRD.md (dòng kiểm tra của doctor) nêu doctor gộp hai mã journal theo file kèm số bản ghi, và CHANGELOG có bullet tương ứng.

## Required checks

- [x] `chk-focus` (focused): Test tập trung của thay đổi — pass (2026-11-04 13:45:35 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-11-04 13:46:52 +07:00)

## Decisions

- **dec-epic-closer** — Task này là task cuối theo thứ tự epic nên đóng epic bằng bản phát hành 2.27.0 (version:sync 2.27.0 --fold-dev), dù skills-token-research có ID lớn hơn.
  - _Why:_ Quyết định của người dùng ngày 2026-11-04: task cuối cùng trong epic làm bản phát hành; thứ tự epic (--epic-order) là chuẩn, ID chỉ là nhãn tạo sau.

## Evidence

- `chk-focus` — pass (2026-11-04 13:45:35 +07:00): pnpm exec vitest run test/unit/core/doctor test/integration/commands/doctor.test.ts test/workflow/doctor-finding-fixtures-project.test.ts — exit 0
- `chk-suite` — pass (2026-11-04 13:46:52 +07:00): pnpm test — exit 0
