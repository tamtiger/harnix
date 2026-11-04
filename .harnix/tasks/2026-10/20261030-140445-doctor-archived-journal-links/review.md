# Doctor không báo journal của task đã archive là mồ côi

- **ID:** 20261030-140445-doctor-archived-journal-links
- **Mode:** lite
- **Status:** completed/finishing
- **Created:** 2026-10-30 14:04:45 +07:00
- **Updated:** 2026-11-04 10:27:54 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 2/2 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Journal tham chiếu task hoặc evidence của task nằm trong _archive không còn bị doctor báo journal-task-unlinked hoặc journal-evidence-unlinked; chỉ task thật sự không tồn tại ở live lẫn archive mới bị báo.

## Relevant paths

- `CHANGELOG.md`
- `docs/HARNIX_PRD.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `src/core/doctor/project-tasks.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +28 / -28 |
| `docs/HARNIX_PRD.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/core/doctor/archived-tasks.ts` | added | - |
| `src/core/doctor/project-tasks.ts` | modified | +3 / -1 |
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
| `test/unit/core/doctor/archived-tasks.test.ts` | added | - |
| `test/unit/core/doctor/project-tasks.test.ts` | modified | +73 / -0 |

## Acceptance criteria

- [x] `ac-1` (met): inspectJournalRecords của doctor tra task trong cả live lẫn _archive (đọc chỉ đọc): journal của task đã archive không sinh journal-task-unlinked hay journal-evidence-unlinked, còn task không có ở đâu cả vẫn bị báo; test cho cả ba trường hợp và fixture mã hiện có vẫn pass.
- [x] `ac-2` (met): docs/HARNIX_PRD.md (mục Doctor, dòng liệt kê các kiểm tra offline) nêu rằng journal-task-unlinked và journal-evidence-unlinked chỉ báo khi task không có ở live lẫn _archive, và docs/IMPLEMENTATION_PLAN.md được đồng bộ nếu có mục Doctor tương ứng; CHANGELOG ghi một bullet Fixed cho bản vá.

## Required checks

- [x] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-11-04 10:27:22 +07:00)
- [x] `chk-doctor` (focused): Test doctor và fixture mã finding — pass (2026-11-04 10:25:50 +07:00)
- [x] `chk-docs` (focused): Test hợp đồng tài liệu và so khớp release sequence — pass (2026-11-04 10:25:58 +07:00)

## Decisions

- **source** — Phát hiện khi chạy doctor sau epic workflow-ergonomics: 73 journal-task-unlinked và 6 journal-evidence-unlinked, id trỏ tới task trong .harnix/tasks/_archive.
  - _Why:_ Archive là bước thủ công hợp lệ nên doctor không được coi nó là dữ liệu mất.
- **dec-no-overlap** — Epic session-review (8 task, đã hoàn thành) không chạm doctor journal, archive hay project-tasks.ts, nên task này không trùng phạm vi; thay đổi lên 2.26.x mới ở bản vá kế tiếp.
  - _Why:_ Đối chiếu ngày 2026-11-04 sau khi rebase lên origin/v2: epic có các task run-check-command-gate, cli-error-hints, status-epic-learning-noise, context-hook-dedup, global-setup-hardening, test-stability, docs-contract-sync, cookbook-skill-guidance.

## Evidence

- `chk-doctor` — pass (2026-11-04 10:25:50 +07:00): pnpm exec vitest run test/unit/core/doctor test/integration/commands/doctor.test.ts test/workflow/doctor-finding-fixtures-project.test.ts — exit 0
- `chk-docs` — pass (2026-11-04 10:25:58 +07:00): pnpm test:gates — exit 0
- `check-suite` — pass (2026-11-04 10:27:22 +07:00): pnpm test — exit 0
