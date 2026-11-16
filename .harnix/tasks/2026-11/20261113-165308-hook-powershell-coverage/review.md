# Hook nhắc repo-map bắt cả tool PowerShell

- **ID:** 20261113-165308-hook-powershell-coverage
- **Mode:** lite
- **Epic:** 20261113-165307-agent-feedback-hardening
- **Status:** completed/finishing
- **Created:** 2026-11-13 16:53:07 +07:00
- **Updated:** 2026-11-13 17:04:32 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 2/2 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Hook PreToolUse nhắc dùng repo-map cũng chạy cho tool PowerShell và nhận diện Select-String, để agent trên Windows không bỏ sót lời nhắc.

## Non-goals

- Không đổi frozen contract ngoài phạm vi member này.
- Không chặn lệnh của agent; chỉ nhắc hoặc cảnh báo.

## Relevant paths

- `src/commands/pretool-hint.ts`
- `src/configurators/claude.ts`
- `src/core/platform/facts.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +2 / -1 |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +1 / -1 |
| `docs/HARNIX_PRD.md` | modified | +1 / -1 |
| `docs/IMPLEMENTATION_PLAN.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/commands/pretool-hint.ts` | modified | +29 / -1 |
| `src/configurators/claude.ts` | modified | +1 / -1 |
| `src/core/platform/facts.ts` | modified | +1 / -1 |
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
| `test/platform/claude-global.test.ts` | modified | +1 / -1 |
| `test/platform/settings-json-fidelity.test.ts` | modified | +3 / -3 |
| `test/unit/commands/pretool-hint.test.ts` | modified | +30 / -0 |

## Acceptance criteria

- [x] `ac-1` (met): Matcher của nhóm hook `harnix-repo-map-hint` gồm tool PowerShell bên cạnh Grep và Bash.
- [x] `ac-2` (met): Lệnh PowerShell dùng Select-String hoặc Get-ChildItem -Recurse nối Select-String với một định danh duy nhất nhận được lời nhắc không chặn; từ khóa không phải symbol và ngoài project Harnix thì im lặng.

## Required checks

- [x] `chk-1` (focused): Test tập trung của hook-powershell-coverage — pass (2026-11-13 17:02:37 +07:00)
- [x] `chk-2` (full): Bộ test toàn dự án — pass (2026-11-13 17:04:05 +07:00)

## Evidence

- `chk-1` — pass (2026-11-13 17:02:37 +07:00): pnpm exec vitest run test/unit/commands/pretool-hint.test.ts test/platform/claude-global.test.ts test/platform/settings-json-fidelity.test.ts — exit 0
- `chk-2` — pass (2026-11-13 17:04:05 +07:00): pnpm test — exit 0
