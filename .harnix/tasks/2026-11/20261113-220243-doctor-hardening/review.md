# Doctor: cô lập lỗi theo nền tảng và cảnh báo cache repo-map bị git theo dõi

- **ID:** 20261113-220243-doctor-hardening
- **Mode:** lite
- **Epic:** 20261113-220240-harnix-review-hardening
- **Status:** completed/finishing
- **Created:** 2026-11-13 22:02:39 +07:00
- **Updated:** 2026-11-13 22:18:12 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 2/2 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

doctor không báo invalid cho mọi nền tảng vì một biến môi trường sai, và phát hiện .harnix/cache bị git theo dõi.

## Non-goals

- Không tự chạy git rm --cached; việc gỡ file khỏi index do người dùng duyệt.

## Relevant paths

- `src/core/doctor`
- `src/core/platform/user-paths.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +2 / -2 |
| `CHANGELOG.md` | modified | +12 / -0 |
| `README.md` | modified | +1 / -1 |
| `docs/GLOBAL_SETUP_REFACTOR_PLAN.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/core/doctor/finding-codes-global.ts` | modified | +1 / -0 |
| `src/core/doctor/finding-codes-project.ts` | modified | +1 / -0 |
| `src/core/doctor/global-inspect.ts` | modified | +8 / -4 |
| `src/core/doctor/global-linked.ts` | added | - |
| `src/core/doctor/global.ts` | modified | +60 / -21 |
| `src/core/doctor/project-runtime.ts` | modified | +19 / -3 |
| `src/core/global/uninstall.ts` | modified | +4 / -1 |
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
| `test/unit/core/doctor/global-inspect.test.ts` | modified | +28 / -1 |
| `test/unit/core/doctor/global-linked.test.ts` | added | - |
| `test/unit/core/doctor/global.test.ts` | modified | +11 / -0 |
| `test/unit/core/doctor/project-runtime.test.ts` | modified | +16 / -1 |
| `test/unit/core/global/uninstall.test.ts` | modified | +32 / -1 |

## Acceptance criteria

- [x] `ac-1` (met): diagnoseGlobal resolve root theo từng nền tảng: một CODEX_HOME rỗng hay sai chỉ làm nền tảng Codex bị invalid, message nêu tên biến (không lộ giá trị) (S5).
- [x] `ac-2` (met): doctor có finding warning mới (mã trong DOCTOR_FINDING_CODES kèm fixture) khi git theo dõi .harnix/cache, theo mẫu active-pointer-tracked (A1).

## Required checks

- [x] `chk-focused` (focused): Test doctor — pass (2026-11-13 22:16:13 +07:00)
- [x] `check-suite` (full): Toàn bộ bộ test của dự án — pass (2026-11-13 22:18:08 +07:00)

## Decisions

- **dec-source** — Nguồn của task: báo cáo review toàn bộ Harnix ngày 2026-11-13 (research.md của epic).
  - _Why:_ Mỗi tiêu chí là một phát hiện đã được nhóm review nêu kèm file:dòng; phải đối chiếu lại với mã hiện tại trước khi chuyển sang ready.

## Evidence

- `chk-focused` — pass (2026-11-13 22:16:13 +07:00): pnpm exec vitest run test/unit/core/doctor test/integration/commands/doctor.test.ts --coverage.enabled=false — exit 0
- `check-suite` — pass (2026-11-13 22:18:08 +07:00): pnpm test — exit 0
