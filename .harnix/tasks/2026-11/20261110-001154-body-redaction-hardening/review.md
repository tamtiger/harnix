# Tăng cường che secret của repo-map --body

- **ID:** 20261110-001154-body-redaction-hardening
- **Mode:** lite
- **Epic:** 20261109-194501-repo-map-insights
- **Follow-up of:** 20261109-200113-repo-map-symbol-body
- **Status:** completed/finishing
- **Created:** 2026-11-10 00:11:54 +07:00
- **Updated:** 2026-11-10 00:16:15 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 1/1 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Che thêm các dạng secret còn lọt trong thân symbol của --body: YAML không dấu nháy, giá trị trong dấu nháy ngược, và token theo tiền tố nhà cung cấp.

## Relevant paths

- `CHANGELOG.md`
- `README.md`
- `docs/HARNESS_RESEARCH.md`
- `docs/HARNIX_PRD.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `src/cli-helpers.ts`
- `src/cli-workflow-commands.ts`
- `src/commands/repo-map-internal.ts`
- `src/core/repo-map/outline-body.ts`
- `src/core/repo-map/outline.ts`
- `src/core/repo-map/service.ts`
- `src/core/repo-map/types.ts`
- `test/unit/cli-helpers.test.ts`
- `test/unit/core/repo-map/outline-body.test.ts`
- `test/unit/core/repo-map/outline.test.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +2 / -2 |
| `CHANGELOG.md` | modified | +19 / -0 |
| `README.md` | modified | +2 / -2 |
| `docs/HARNESS_RESEARCH.md` | modified | +2 / -2 |
| `docs/HARNIX_PRD.md` | modified | +1 / -1 |
| `docs/HARNIX_WORKFLOW.md` | modified | +1 / -1 |
| `docs/IMPLEMENTATION_PLAN.md` | modified | +10 / -2 |
| `docs/RULE_OWNERSHIP.md` | modified | +1 / -0 |
| `docs/prompts/repo-graph-tools-research.md` | modified | +75 / -35 |
| `package.json` | modified | +1 / -1 |
| `src/cli-helpers.ts` | modified | +29 / -7 |
| `src/cli-workflow-commands.ts` | modified | +2 / -1 |
| `src/commands/repo-map-internal.ts` | modified | +64 / -10 |
| `src/core/context/effective-context.ts` | modified | +5 / -0 |
| `src/core/repo-map/compact.ts` | modified | +50 / -1 |
| `src/core/repo-map/extract-imports.ts` | added | - |
| `src/core/repo-map/extract-symbols.ts` | added | - |
| `src/core/repo-map/extract.ts` | modified | +39 / -58 |
| `src/core/repo-map/graph-references.ts` | added | - |
| `src/core/repo-map/graph.ts` | modified | +15 / -3 |
| `src/core/repo-map/impact.ts` | modified | +21 / -15 |
| `src/core/repo-map/outline-body.ts` | added | - |
| `src/core/repo-map/outline-helpers.ts` | modified | +1 / -0 |
| `src/core/repo-map/outline.ts` | modified | +6 / -3 |
| `src/core/repo-map/references.ts` | added | - |
| `src/core/repo-map/refresh-summary.ts` | added | - |
| `src/core/repo-map/refs.ts` | modified | +3 / -2 |
| `src/core/repo-map/search-terms.ts` | added | - |
| `src/core/repo-map/search.ts` | modified | +29 / -39 |
| `src/core/repo-map/service.ts` | modified | +61 / -26 |
| `src/core/repo-map/store.ts` | modified | +50 / -8 |
| `src/core/repo-map/test-convention.ts` | added | - |
| `src/core/repo-map/tests.ts` | modified | +83 / -110 |
| `src/core/repo-map/types.ts` | modified | +21 / -1 |
| `src/core/repo-map/workspace.ts` | modified | +10 / -3 |
| `src/core/workflow/context.ts` | modified | +2 / -2 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +2 / -2 |
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
| `src/templates/harnix/activation.ts` | modified | +1 / -1 |

_(26 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): Các dòng password: hunter2xx, const k = "AKIAIOSFODNN7EXAMPLE", token ghp_..., và "token" : `abcdefghij` bị che thành [redacted] trong thân symbol của --body, trong khi dòng kiểu khai báo kiểu như password: string vẫn được giữ nguyên; có test cho từng dạng.

## Required checks

- [x] `check-1` (focused): Kiểm chứng: Tăng cường che secret của repo-map --body — pass (2026-11-10 00:14:37 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án — pass (2026-11-10 00:16:02 +07:00)

## Evidence

- `check-1` — pass (2026-11-10 00:14:37 +07:00): pnpm exec vitest run repo-map — exit 0
- `chk-suite` — pass (2026-11-10 00:16:02 +07:00): pnpm test — exit 0
