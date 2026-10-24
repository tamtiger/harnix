# Contextual Technique Hints, lệnh skill --suggest, Actionable Error Messages, cảnh báo Stale Facts và đóng Epic

- **ID:** 20261023-170411-preflight-hints-skill-suggest-and-closing
- **Mode:** lite
- **Epic:** 20261023-170406-enterprise-events-brief-defaults-and-multi-workspace
- **Status:** completed/finishing
- **Created:** 2026-10-23 17:04:11 +07:00
- **Updated:** 2026-10-23 21:56:22 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 5/5 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Thêm suggestedTechniques vào workflow --preflight; bổ sung lệnh harnix skill --suggest; Actionable Error Suggestions; cảnh báo projectFactsStale: true; đồng bộ tài liệu, pnpm selfhost:sync và đóng Epic.

## Relevant paths

- `src/cli-workflow-commands.ts`
- `src/commands/skills.ts`
- `src/core/spec/project-facts.ts`
- `src/core/workflow/preflight.ts`
- `test/integration/commands/skills.test.ts`
- `test/unit/core/workflow/preflight.test.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +14 / -0 |
| `README.md` | modified | +34 / -32 |
| `package.json` | modified | +1 / -1 |
| `src/cli-helpers.ts` | modified | +1 / -1 |
| `src/cli-workflow-commands.ts` | modified | +32 / -20 |
| `src/commands/repo-map-internal.ts` | modified | +22 / -5 |
| `src/commands/skills-suggest.ts` | added | - |
| `src/commands/skills.ts` | modified | +6 / -0 |
| `src/commands/workflow-command.ts` | modified | +29 / -4 |
| `src/commands/workflow-flag-owners.ts` | modified | +8 / -2 |
| `src/commands/workflow-flags.ts` | modified | +1 / -0 |
| `src/commands/workflow-handlers.ts` | modified | +2 / -0 |
| `src/core/config/config-schema.ts` | modified | +8 / -0 |
| `src/core/config/config-validate.ts` | modified | +20 / -0 |
| `src/core/repo-map/event-discovery.ts` | modified | +35 / -3 |
| `src/core/repo-map/event-matrix.ts` | modified | +100 / -6 |
| `src/core/spec/project-facts.ts` | modified | +9 / -3 |
| `src/core/workflow/preflight.ts` | modified | +50 / -1 |
| `src/core/workflow/transition.ts` | modified | +5 / -1 |
| `src/skills/catalog.ts` | modified | +2 / -0 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/references/invariant-debugging.md` | added | - |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/references/concurrency-isolation.md` | added | - |
| `src/skills/harnix-implement/SKILL.md` | modified | +3 / -4 |
| `src/skills/harnix-implement/references/dotnet-microservices.md` | added | - |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-migration-safety/references/zero-downtime-evolution.md` | added | - |
| `src/skills/harnix-plan/SKILL.md` | modified | +2 / -2 |
| `src/skills/harnix-research/SKILL.md` | modified | +2 / -2 |
| `src/skills/harnix-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/references/injection-traversal-guardrails.md` | added | - |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/references/multi-step-tree-search.md` | added | - |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/references/verification-blindspots.md` | added | - |
| `src/skills/harnix-verify/SKILL.md` | modified | +1 / -1 |
| `src/skills/technique-skills.ts` | modified | +42 / -6 |
| `src/utils/bounded-input.ts` | modified | +8 / -1 |
| `test/integration/commands/skills.test.ts` | modified | +25 / -2 |
| `test/integration/commands/workflow-flags.test.ts` | modified | +3 / -0 |
| `test/platform/codex-global.test.ts` | modified | +1 / -1 |
| `test/unit/commands/skills-suggest.test.ts` | added | - |
| `test/unit/commands/workflow-handlers.test.ts` | modified | +46 / -0 |
| `test/unit/core/repo-map/event-discovery.test.ts` | modified | +32 / -0 |
| `test/unit/core/repo-map/event-matrix.test.ts` | modified | +177 / -0 |
| `test/unit/core/workflow/preflight.test.ts` | modified | +18 / -0 |

_(4 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): workflow --preflight tự động phân tích ngữ cảnh và trả về suggestedTechniques?: string[] dựa trên triệu chứng thực tế.
- [x] `ac-2` (met): Bổ sung lệnh harnix skill --suggest <query> hỗ trợ tìm kiếm skill theo mô tả ngữ nghĩa.
- [x] `ac-3` (met): Actionable Error Suggestions cho lỗi schema validation và sai checkpoint/stage.
- [x] `ac-4` (met): Preflight phát hiện commit hash của HEAD thay đổi so với thời điểm trích xuất facts thì cảnh báo projectFactsStale: true.
- [x] `ac-5` (met): Đồng bộ tài liệu dự án, chạy pnpm selfhost:sync và bump minor package đóng Epic.

## Required checks

- [x] `check-suite` (full): Toàn bộ test suite của dự án phải xanh — pass (2026-10-23 21:55:52 +07:00)
- [x] `check-preflight-and-suggest` (focused): Kiểm tra suggestedTechniques, projectFactsStale và lệnh skill --suggest — pass (2026-10-23 21:53:37 +07:00)
- [x] `check-preflight-and-suggest-v2` (focused): Kiểm tra suggestedTechniques, projectFactsStale và lệnh skill --suggest — pass (2026-10-23 21:53:20 +07:00)

## Evidence

- `check-preflight-and-suggest` — pass (2026-10-23 21:53:37 +07:00): pnpm vitest run test/unit/core/workflow/preflight.test.ts test/unit/commands/skills-suggest.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-23 21:55:52 +07:00): pnpm test — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
- skipped (2026-10-23 21:51:35 +07:00): Task contract revised at persisted replan: Thay thế check do gộp test file theo kiến trúc test suite
- `check-preflight-and-suggest-v2` — pass (2026-10-23 21:53:20 +07:00): pnpm vitest run test/unit/core/workflow/preflight.test.ts test/integration/commands/skills.test.ts — exit 0
