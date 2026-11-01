# Siết setup global: notice không bị nuốt, hook Codex cũ, an toàn symlink

- **ID:** 20261101-082449-global-setup-hardening
- **Mode:** full
- **Epic:** 20261101-082443-harnix-session-review
- **Status:** completed/finishing
- **Created:** 2026-11-01 08:24:43 +07:00
- **Updated:** 2026-11-02 00:22:58 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 2/2 passed |
| Residual risks | 2 | r-codex-unrecorded-hook: low, r-atomic-follow: low |

## Goal

Đóng R4–R10 của review global và S1/S2: notice bị nuốt khi thiếu launcher, thiếu migrate hooks.json Codex, mã `test-*-required` phát khi có VITEST, symlink dotfile, đọc symlink ngoài root.

## Non-goals

- Không đổi frozen contract nếu chưa cập nhật PRD, workflow, migration và test trong cùng thay đổi.
- Không commit, branch, push hay publish.

## Relevant paths

- `src/core/global/setup.ts`
- `src/core/spec/project-skills.ts`
- `src/core/stack/verify-detection.ts`
- `src/core/stack/workspace-detection.ts`
- `src/utils/atomic-write.ts`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +36 / -0 |
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
| `src/utils/atomic-write.ts` | modified | +26 / -2 |
| `src/utils/project-discovery.ts` | modified | +8 / -0 |
| `src/utils/safe-read.ts` | added | - |
| `src/utils/safe-slice.ts` | added | - |
| `test/integration/commands/workflow-command.test.ts` | modified | +6 / -12 |
| `test/integration/scenarios/epic-next-selection.test.ts` | added | - |

_(17 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): Notice trust/precedence/shadow của Codex, Antigravity, OpenCode luôn hiển thị kể cả khi thiếu launcher trên PATH.
- [x] `ac-3` (met): Ghi atomic vào đích là symlink nội bộ thì ghi vào đích thật của symlink (symlink vẫn còn, không bị thay bằng file thường); symlink treo bị từ chối rõ ràng.
- [x] `ac-5` (met): discoverProjectSkills bỏ qua thư mục skill, SKILL.md hoặc reference là symlink trỏ ra ngoài root dự án, nên harnix skill không phục vụ nội dung ngoài root.
- [x] `ac-6` (met): Stack detection (readSafeText) không đọc manifest là symlink trỏ ra ngoài thư mục dự án.

## Required checks

- [x] `chk-focused` (focused): Cổng hợp đồng và test tập trung — pass (2026-11-02 00:21:30 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án xanh — pass (2026-11-02 00:22:49 +07:00)

## Decisions

- **d-drop-ac2** — Bỏ ac-2 (hooks.json Codex): migrate đã có test với bản ghi sidecar; hook không có bản ghi sidecar không được suy ra quyền sở hữu theo AGENTS.md, nên giữ nguyên là hành vi đúng.
  - _Why:_ Đối chiếu code: migrate dựa vào entry json-member path hooks.json trong sidecar (codex-legacy-setup.test.ts).
- **d-drop-ac3a** — Bỏ ac-3a (test-home-required khi VITEST) và ac-4 (mọi test dùng home dùng một lần): không có bằng chứng bug; isTestProcess và guard đã ép.
  - _Why:_ Review ready-review đối chiếu HEAD.
- **d-atomic-symlink** — Atomic write theo symlink nội bộ: resolve realpath của đích rồi ghi vào đích thật; symlink treo bị từ chối. Việc chặn symlink ra ngoài root vẫn do resolveSafeUserPath ở caller.
  - _Why:_ Tránh thay symlink dotfile bằng file thường.

## Residual risks

- **r-codex-unrecorded-hook** (low) — Hook Harnix trong hooks.json Codex không có bản ghi sidecar không được migrate hay cảnh báo (có thể chạy hai lần); chưa có doctor finding.
- **r-atomic-follow** (low) — atomicWriteFile theo symlink đích mà không tự kiểm root; an toàn dựa vào resolveSafeUserPath/resolveSafeHarnixPath ở caller. Test symlink file bị bỏ qua có điều kiện trên máy Windows không có quyền tạo symlink (logic vẫn được test qua filesystem inject và junction).

## Evidence

- `chk-focused` — pass (2026-11-02 00:21:30 +07:00): pnpm exec vitest run test/integration/scenarios test/unit/core/doctor test/unit/utils/atomic-write.test.ts test/unit/core/global test/unit/core/spec test/unit/core/stack — exit 0
- `chk-suite` — pass (2026-11-02 00:22:49 +07:00): pnpm test — exit 0
