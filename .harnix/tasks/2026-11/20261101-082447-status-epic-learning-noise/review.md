# Giảm nhiễu status/resume theo epic cũ và learning draft

- **ID:** 20261101-082447-status-epic-learning-noise
- **Mode:** lite
- **Epic:** 20261101-082443-harnix-session-review
- **Status:** completed/finishing
- **Created:** 2026-11-01 08:24:43 +07:00
- **Updated:** 2026-11-02 00:05:15 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 2/2 met or waived |
| Required checks | 100% | 3/3 passed |
| Residual risks | 1 | risk-ac3: low |

## Goal

Đóng D2/H10/H11/D4: `status` và `resume --next` quét epic cũ nhất, epic hỏng làm dừng im lặng, thứ tự epic theo ID, draft learning chỉ mô tả code.

## Non-goals

- Không đổi frozen contract nếu chưa cập nhật PRD, workflow, migration và test trong cùng thay đổi.
- Không commit, branch, push hay publish.

## Relevant paths

- `src/commands/epic.ts`
- `src/commands/resume.ts`
- `src/commands/status.ts`
- `src/core/epics/epic-location.ts`
- `src/core/epics/epic.ts`
- `src/core/journal/learning-capture.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +24 / -0 |
| `README.md` | modified | +1 / -1 |
| `docs/HARNIX_PRD.md` | modified | +2 / -2 |
| `docs/HARNIX_WORKFLOW.md` | modified | +3 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/cli-helpers.ts` | modified | +3 / -1 |
| `src/cli-hints.ts` | modified | +25 / -0 |
| `src/commands/archive.ts` | modified | +2 / -2 |
| `src/commands/audit.ts` | modified | +2 / -2 |
| `src/commands/checks.ts` | modified | +2 / -2 |
| `src/commands/context-report.ts` | modified | +2 / -2 |
| `src/commands/epic.ts` | modified | +27 / -4 |
| `src/commands/learning.ts` | modified | +2 / -2 |
| `src/commands/pause.ts` | modified | +2 / -2 |
| `src/commands/repo-map-internal.ts` | modified | +2 / -2 |
| `src/commands/resume.ts` | modified | +4 / -12 |
| `src/commands/status.ts` | modified | +9 / -19 |
| `src/commands/tasks.ts` | modified | +2 / -2 |
| `src/commands/workflow-flags.ts` | modified | +19 / -6 |
| `src/core/epics/epic-location.ts` | modified | +9 / -0 |
| `src/core/epics/epic.ts` | modified | +3 / -2 |
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
| `src/utils/project-discovery.ts` | modified | +8 / -0 |
| `test/integration/commands/workflow-command.test.ts` | modified | +6 / -12 |
| `test/integration/scenarios/epic-next-selection.test.ts` | added | - |
| `test/unit/cli-hints.test.ts` | modified | +19 / -0 |
| `test/unit/core/epics/epic-location.test.ts` | modified | +12 / -0 |
| `test/unit/core/tasks/read-tracker.test.ts` | modified | +37 / -6 |
| `test/unit/core/workflow/epic-replay.test.ts` | added | - |
| `test/unit/core/workflow/run-check.test.ts` | modified | +21 / -16 |
| `test/workflow/behavior-snapshot.golden.json` | modified | +1 / -1 |
| `test/workflow/cli-contract.test.ts` | modified | +36 / -0 |
| `vitest.config.ts` | modified | +2 / -0 |

## Acceptance criteria

- [x] `ac-1` (met): `status` và `resume --next` chọn epic mới nhất còn việc dở trước; epic không đọc được bị bỏ qua với một dòng `notice:` trên stderr, không ném lỗi và không làm mất epic còn lại.
- [x] `ac-2` (met): `harnix epic` sắp epic có tiền tố ngày-giờ theo tiền tố giảm dần, epic legacy không tiền tố xếp sau; epic không đọc được không bị giấu mà báo bằng `notice:` trên stderr, `total` vẫn chỉ đếm epic đọc được.

## Required checks

- [x] `chk-focused` (focused): Test tập trung status/resume/epic — pass (2026-11-02 00:03:44 +07:00)
- [x] `chk-suite` (full): Toàn bộ suite — pass (2026-11-02 00:05:10 +07:00)
- [x] `chk-gates` (focused): Gate hợp đồng — pass (2026-11-02 00:03:52 +07:00)

## Residual risks

- **risk-ac3** (low) — Bộ lọc learning 'chỉ mô tả code' tổng quát chưa có: isLocalDecisionOnly đã nối vào learning-notes và learning-prune, chỉ bắt câu có đường dẫn/đuôi file mà không có điều kiện áp dụng; draft mô tả hành động không nêu đường dẫn vẫn lọt. Không thêm lệnh mới ở member này.

## Evidence

- `chk-focused` — pass (2026-11-02 00:03:44 +07:00): pnpm exec vitest run test/integration/commands/status.test.ts test/integration/commands/resume.test.ts test/integration/commands/epic.test.ts test/unit/core/epics — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-gates` — pass (2026-11-02 00:03:52 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-suite` — pass (2026-11-02 00:05:10 +07:00): pnpm test — exit 0
