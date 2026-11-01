# Bổ sung cookbook và skill cho các lệnh hay bị gọi sai

- **ID:** 20261101-082452-cookbook-skill-guidance
- **Mode:** lite
- **Epic:** 20261101-082443-harnix-session-review
- **Status:** completed/finishing
- **Created:** 2026-11-01 08:24:43 +07:00
- **Updated:** 2026-11-02 00:35:07 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 5/5 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Đóng B1/C1/C3/R7–R9/R11: cookbook thiếu `--set-baseline`, `--cancel`, `pause`, `repo-map`; thiếu hướng dẫn heredoc có dấu nháy và `PYTHONIOENCODING`; Commit discipline không lặp quy tắc nhánh và pipe. Thành viên cuối đóng epic.

## Non-goals

- Không đổi frozen contract nếu chưa cập nhật PRD, workflow, migration và test trong cùng thay đổi.
- Không commit, branch, push hay publish.

## Relevant paths

- `.harnix/.template-hashes.json`
- `.harnix/workflow.md`
- `CHANGELOG.md`
- `package.json`
- `src/skills/harnix-verify/references/cookbook-commands.md`
- `src/skills/harnix-verify/references/cookbook-notes.md`
- `src/templates/harnix/workflow.md`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +16 / -0 |
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
| `src/skills/harnix-verify/references/cookbook-notes.md` | modified | +3 / -0 |
| `src/templates/harnix/workflow.md` | modified | +8 / -4 |
| `src/utils/atomic-write.ts` | modified | +26 / -2 |
| `src/utils/project-discovery.ts` | modified | +8 / -0 |
| `src/utils/safe-read.ts` | added | - |

_(20 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): Khối Command cookbook của `workflow.md` có dòng cú pháp đầy đủ cho `--set-baseline`, `--cancel --reason`, `pause` (chỉ nhận `--dry-run`, không nhận `--brief`), `repo-map`, và ghi rõ `status` không nhận tham số vị trí.
- [x] `ac-2` (met): `cookbook-notes` hướng dẫn script phụ có dấu nháy (ghi file bằng công cụ file vào `.harnix/tmp/` rồi chạy, không heredoc nhúng nháy), `PYTHONIOENCODING`/`python -I`; Commit discipline trong `workflow.md` chỉ trỏ tới quy tắc có sẵn, không lặp lại.
- [x] `ac-3` (met): Đã chạy `pnpm selfhost:sync`: `.harnix/workflow.md` được regenerate và manifest khớp template.
- [x] `ac-4` (met): Các skill và template đúng ngân sách token (test instruction-budget xanh) và qua checklist SKILL.md: không nhắc lệnh riêng của repo, mỗi reference có một dòng trỏ tới nó, dòng phiên bản cập nhật.
- [x] `ac-5` (met): Đã phát hành minor 2.24.0 đóng epic bằng `pnpm version:sync --fold-dev`: các mục dev.1-dev.7 gộp thành một entry `2.24.0` trong CHANGELOG.

## Required checks

- [x] `chk-focused` (focused): Cổng hợp đồng: instruction-budget, skill-sources, docs, golden — pass (2026-11-02 00:33:42 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án xanh — pass (2026-11-02 00:35:00 +07:00)

## Evidence

- `chk-focused` — pass (2026-11-02 00:33:42 +07:00): pnpm test:gates — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
- `chk-suite` — pass (2026-11-02 00:35:00 +07:00): pnpm test — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
