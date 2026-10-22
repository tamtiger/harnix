# Sửa False Positives Secret Filter và Bổ sung Default Action cho Repo-Map

- **ID:** 20261022-153613-repomap-secret-filter-and-default-action
- **Mode:** lite
- **Epic:** 20261022-153552-repomap-csharp-workspace-fixes
- **Status:** completed/finishing
- **Created:** 2026-10-22 15:36:13 +07:00
- **Updated:** 2026-10-22 16:05:44 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 2/2 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Sửa False Positives Secret Filter và Bổ sung Default Action cho Repo-Map

## Relevant paths

- `src/cli-helpers.ts`
- `src/commands/repo-map-internal.ts`
- `src/core/repo-map/inventory.ts`
- `src/core/repo-map/outline.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/cli-helpers.ts` | modified | +11 / -3 |
| `src/commands/repo-map-internal.ts` | modified | +46 / -4 |
| `src/core/repo-map/inventory.ts` | modified | +2 / -1 |
| `src/core/repo-map/outline.ts` | modified | +1 / -1 |
| `src/core/repo-map/workspace.ts` | modified | +46 / -0 |
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
| `test/integration/commands/repo-map-internal.test.ts` | modified | +16 / -10 |
| `test/integration/scenarios/status-workspace.test.ts` | modified | +19 / -5 |
| `test/unit/core/repo-map/event-matrix.test.ts` | modified | +2 / -2 |
| `test/unit/core/repo-map/inventory.test.ts` | modified | +21 / -0 |
| `test/unit/core/repo-map/outline.test.ts` | modified | +8 / -0 |
| `test/workflow/version-sync.test.ts` | modified | +4 / -4 |

## Acceptance criteria

- [x] `ac-1` (met): Secret path filter trong repo-map (inventory.ts, outline.ts) không loại trừ các file mã nguồn nghiệp vụ (.cs, .ts, .tsx, .js, .java...) có tên chứa token/credential/secret, trong khi vẫn loại trừ chính xác các file cấu hình nhạy cảm (.env*, id_rsa*, *.pem, *.key, *secret*.json...).
- [x] `ac-2` (met): Lệnh harnix repo-map và harnix repo-map --workspace khi không truyền action flag (--query, --impact, ...) thực hiện hành vi mặc định là in ra tóm tắt trạng thái repo-map thay vì ném lỗi exit code 2.

## Required checks

- [x] `check-repomap-default-action` (focused): Kiểm tra lệnh harnix repo-map và harnix repo-map --workspace in ra tóm tắt status thay vì exit code 2 khi thiếu cờ — pass (2026-10-22 16:04:59 +07:00)
- [x] `check-secret-filter` (focused): Kiểm tra inventory và outline không skip nhầm file code nghiệp vụ chứa token/credential và vẫn skip secret config file — pass (2026-10-22 15:43:50 +07:00)
- [x] `check-suite-v5` (full): Replacement for check-suite-v4 — pass (2026-10-22 16:04:37 +07:00)

## Evidence

- `check-secret-filter` — pass (2026-10-22 15:43:50 +07:00): pnpm vitest run test/unit/core/repo-map/inventory.test.ts test/unit/core/repo-map/outline.test.ts — exit 0
- `check-repomap-default-action` — pass (2026-10-22 16:04:59 +07:00): pnpm vitest run test/integration/commands/repo-map-internal.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — fail (2026-10-22 15:48:55 +07:00): pnpm test — exit 1 _(1 earlier rerun not shown; see task.json for full history)_
- skipped (2026-10-22 15:50:37 +07:00): Task contract revised at persisted replan: Cap nhat inputs check suite sang src/** va test/** de unblock circuit breaker va toi uu hoa toc do snapshot
- `check-suite-v2` — fail (2026-10-22 15:52:24 +07:00): pnpm test — exit 1
- skipped (2026-10-22 15:54:37 +07:00): Task contract revised at persisted replan: On dinh hoa test status-workspace voi protocol file allow va no-local va them package.json vao inputs
- `check-suite-v3` — fail (2026-10-22 15:56:26 +07:00): pnpm test — exit 1
- skipped (2026-10-22 15:59:15 +07:00): Task contract revised at persisted replan: On dinh hoa version-sync test dung script URL thay vi process.cwd va dat input **
- `check-suite-v4` — fail (2026-10-22 16:01:11 +07:00): pnpm test — exit 1
- skipped (2026-10-22 16:02:54 +07:00): Task contract revised at persisted replan: Bo sung test phu day du coverage cho workspace repo-map default action
- `check-suite-v5` — pass (2026-10-22 16:04:37 +07:00): pnpm test — exit 0
