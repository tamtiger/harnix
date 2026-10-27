# Cải thiện tốc độ test: repo mẫu dùng chung, gộp kịch bản trùng, rút ngắn các file chậm nhất

- **ID:** 20261025-182656-improve-test-speed
- **Mode:** full
- **Epic:** 20261025-174418-hardening-and-token-diet
- **Status:** completed/finishing
- **Created:** 2026-10-25 18:26:56 +07:00
- **Updated:** 2026-10-25 20:05:48 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Giảm thời gian chạy toàn bộ test (baseline 109 giây không coverage, 130 giây có coverage, đo ngày 2026-10-25 trên cùng máy) bằng cách dựng repo mẫu một lần rồi copy cho từng test, gộp kịch bản trùng nhau và rút ngắn các file chậm nhất, mà không giảm số test, số assertion hay ngưỡng coverage. Task cuối theo ID nên đóng epic bằng bản minor với --fold-dev.

## Non-goals

- Không hạ ngưỡng coverage, không xóa test để nhanh hơn
- Không đổi lệnh gate pnpm run test và không chạy một phần suite thay cho gate

## Relevant paths

- `test/support`
- `test/workflow/version-sync.test.ts`
- `test/unit/commands/global-uninstall.test.ts`
- `test/workflow/learning-automation.test.ts`
- `test/workflow/legacy-history.test.ts`
- `test/integration/scenarios`
- `vitest.config.ts`
- `test/README.md`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +7 / -7 |
| `CHANGELOG.md` | modified | +13 / -0 |
| `README.md` | modified | +2 / -2 |
| `docs/HARNIX_PRD.md` | modified | +1 / -1 |
| `docs/HARNIX_WORKFLOW.md` | modified | +8 / -0 |
| `package.json` | modified | +1 / -1 |
| `scripts/measure-tokens.mjs` | modified | +18 / -1 |
| `src/cli-helpers.ts` | modified | +13 / -3 |
| `src/cli-hints.ts` | added | - |
| `src/cli-program.ts` | modified | +7 / -6 |
| `src/cli-workflow-commands.ts` | modified | +2 / -2 |
| `src/commands/epic.ts` | modified | +5 / -2 |
| `src/commands/learning.ts` | modified | +2 / -1 |
| `src/commands/skills.ts` | modified | +7 / -1 |
| `src/commands/status.ts` | modified | +5 / -4 |
| `src/commands/workflow-command.ts` | modified | +2 / -1 |
| `src/commands/workflow-flag-owners.ts` | modified | +12 / -27 |
| `src/commands/workflow-flags.ts` | modified | +30 / -48 |
| `src/commands/workflow-handlers.ts` | modified | +6 / -2 |
| `src/core/doctor/restore-artifacts.ts` | modified | +2 / -1 |
| `src/core/global/reconcile.ts` | modified | +1 / -0 |
| `src/core/journal/learning-safety.ts` | modified | +42 / -10 |
| `src/core/managed/decision.ts` | modified | +5 / -2 |
| `src/core/managed/project-files.ts` | modified | +4 / -0 |
| `src/core/repo-map/store.ts` | modified | +1 / -1 |
| `src/core/stack/verify-plan.ts` | modified | +4 / -6 |
| `src/core/tasks/read-tracker.ts` | added | - |
| `src/core/tasks/task-store.ts` | modified | +4 / -1 |
| `src/core/workflow/actions.ts` | added | - |
| `src/core/workflow/baseline.ts` | modified | +7 / -1 |
| `src/core/workflow/brief.ts` | modified | +5 / -30 |
| `src/core/workflow/completion.ts` | modified | +13 / -1 |
| `src/core/workflow/criterion.ts` | modified | +8 / -1 |
| `src/core/workflow/evidence-flags.ts` | modified | +8 / -1 |
| `src/core/workflow/index.ts` | modified | +1 / -1 |
| `src/core/workflow/plan-edit.ts` | modified | +7 / -1 |
| `src/core/workflow/plan-remove.ts` | modified | +21 / -3 |
| `src/core/workflow/replace-check.ts` | modified | +8 / -1 |
| `src/core/workflow/reset-breaker.ts` | modified | +11 / -4 |
| `src/core/workflow/run-check.ts` | modified | +8 / -1 |
| `src/core/workflow/run-checks.ts` | modified | +4 / -1 |
| `src/core/workflow/save.ts` | modified | +44 / -2 |
| `src/core/workflow/schema.ts` | modified | +12 / -1 |
| `src/core/workflow/set-criterion.ts` | modified | +7 / -1 |
| `src/core/workflow/text-integrity.ts` | modified | +6 / -2 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +1 / -1 |

_(53 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): Vitest không cô lập module theo từng file (isolate: false, pool forks giữ nguyên) và test version-sync tiêm format giả trừ test kiểm định dạng, nên không còn spawn prettier cho mỗi lần sync; thời gian collect trong Duration của toàn bộ suite giảm tối thiểu 50% so với baseline 180 giây
- [x] `ac-2` (met): Thời gian chạy toàn bộ test không coverage giảm tối thiểu 25% so với baseline đo lúc bắt đầu task (123 giây, 2.514 test, cùng máy), ghi số đo trước và sau trong decision; toàn bộ suite xanh ba lần liên tiếp, trong đó một lần xáo thứ tự file
- [x] `ac-3` (met): Số test và số assertion không giảm và các ngưỡng coverage trong vitest.config.ts không bị hạ
- [x] `ac-4` (met): test/README.md ghi cách dùng repo mẫu dùng chung và cách đo file chậm

## Required checks

- [x] `chk-slow-files` (focused): Các file chậm nhất vẫn xanh sau khi rút gọn — pass (2026-10-25 20:04:14 +07:00)
- [x] `chk-structure` (focused): Test cấu trúc giữ sàn số test và assertion — pass (2026-10-25 20:04:18 +07:00)
- [x] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-25 20:05:40 +07:00)

## Decisions

- **dec-speed-measure** — Số đo tốc độ test trên cùng máy: baseline 123 giây (collect 180 giây, 2.514 test); sau thay đổi 74 giây, 77 giây khi xáo thứ tự file, 86 giây khi kèm reporter JSON (collect 39-44 giây); giảm 40% so với 123 giây và 32% so với mốc 109 giây cũ; cả ba lần đều xanh 2.514 test
  - _Why:_ Check chỉ kiểm exit code nên số đo được ghi làm vết cho ac-1 và ac-2

## Evidence

- skipped (2026-10-25 20:03:19 +07:00): Task contract revised at persisted replan: Thời gian từng file trong lần chạy đầy đủ phụ thuộc tranh CPU (learning-automation 12,5 giây khi chạy riêng nhưng 31 giây khi chạy cùng suite) nên không phải thước đo ổn định; collect time đo trực tiếp phần việc được bỏ
- `chk-slow-files` — pass (2026-10-25 20:04:14 +07:00): pnpm exec vitest run test/workflow/version-sync.test.ts test/unit/test-structure.test.ts — exit 0
- `chk-structure` — pass (2026-10-25 20:04:18 +07:00): pnpm exec vitest run test/unit/test-structure.test.ts — exit 0
- `check-suite` — pass (2026-10-25 20:05:40 +07:00): pnpm test — exit 0
