# harnix-exercise: ghi công nguồn, đồng bộ tài liệu và phát hành

- **ID:** 20261119-140815-exercise-attribution-and-release
- **Mode:** lite
- **Epic:** 20261119-140811-exercise-skill
- **Status:** completed/finishing
- **Created:** 2026-11-19 14:08:15 +07:00
- **Updated:** 2026-11-19 15:40:29 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Ghi công nguồn ngoài đã adapt, đồng bộ toàn bộ tài liệu và template liên quan, thêm fixture API và CLI mẫu để kiểm skill, rồi đóng epic bằng bản phát hành minor.

## Non-goals

- Không thêm tài liệu ngoài phạm vi skill harnix-exercise
- Không đổi hợp đồng đóng băng

## Relevant paths

- `AGENTS.md`
- `CHANGELOG.md`
- `README.md`
- `docs/HARNESS_RESEARCH.md`
- `docs/HARNIX_PRD.md`
- `docs/HARNIX_WORKFLOW.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/UPSTREAM_BASELINE.md`
- `docs/UPSTREAM_MAPPING.md`
- `package.json`
- `src/templates/harnix/**`
- `test/**`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +12 / -0 |
| `README.md` | modified | +3 / -2 |
| `docs/HARNESS_RESEARCH.md` | modified | +11 / -0 |
| `docs/HARNIX_PRD.md` | modified | +1 / -1 |
| `docs/HARNIX_WORKFLOW.md` | modified | +1 / -1 |
| `docs/UPSTREAM_BASELINE.md` | modified | +12 / -0 |
| `docs/UPSTREAM_MAPPING.md` | modified | +14 / -0 |
| `package.json` | modified | +1 / -1 |
| `src/core/workflow/preflight.ts` | modified | +5 / -0 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-exercise/SKILL.md` | added | - |
| `src/skills/harnix-exercise/references/api.md` | added | - |
| `src/skills/harnix-exercise/references/cli.md` | added | - |
| `src/skills/harnix-exercise/references/detection.md` | added | - |
| `src/skills/harnix-exercise/references/evidence.md` | added | - |
| `src/skills/harnix-exercise/references/safety.md` | added | - |
| `src/skills/harnix-exercise/references/web.md` | added | - |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +2 / -1 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +2 / -1 |
| `src/skills/technique-skills.ts` | modified | +18 / -0 |
| `test/integration/commands/skills.test.ts` | modified | +4 / -0 |
| `test/platform/codex-global.test.ts` | modified | +1 / -1 |
| `test/support/exercise-fixtures.ts` | added | - |
| `test/unit/core/workflow/preflight.test.ts` | modified | +1 / -0 |
| `test/unit/skills/technique-skills.test.ts` | modified | +5 / -0 |
| `test/workflow/exercise-fixtures.test.ts` | added | - |
| `test/workflow/exercise-skill-content.test.ts` | added | - |
| `test/workflow/preflight-exercise.test.ts` | added | - |
| `test/workflow/skill-sources.test.ts` | modified | +9 / -0 |

## Acceptance criteria

- [x] `ac-1` (met): docs/UPSTREAM_MAPPING.md, docs/UPSTREAM_BASELINE.md và docs/HARNESS_RESEARCH.md ghi nguồn đã adapt (Anthropic webapp-testing Apache-2.0, ECC e2e-runner, browser-qa, ai-regression-testing MIT) với URL, giấy phép, quyết định adopt/adapt/defer/reject và ngày truy cập; NOTICE chỉ đổi nếu thực sự tái dùng nội dung gây nghĩa vụ ghi công.
- [x] `ac-2` (met): README.md, AGENTS.md, các platform rules và template (agents.ts, activation.ts, global-surface.ts), docs/HARNIX_PRD.md, docs/HARNIX_WORKFLOW.md, docs/IMPLEMENTATION_PLAN.md và src/templates/harnix/workflow.md được rà soát và đồng bộ; pnpm selfhost:sync chạy khi template workflow đổi.
- [x] `ac-3` (met): Có fixture tối thiểu trong test (một API nhỏ và một CLI nhỏ) cùng test chứng minh quy trình của skill chạy được đầu-cuối bằng công cụ có sẵn trong Node, không cần cài thêm.
- [x] `ac-4` (met): Phiên bản được nâng bằng pnpm version:sync theo chính sách epic (member cuối đóng epic bằng bản minor kèm --fold-dev) và CHANGELOG.md có mục tương ứng.

## Required checks

- [x] `chk-focused` (focused): Test hợp đồng nhanh (docs, CLI contract, ngân sách token, nguồn skill) — pass (2026-11-19 15:34:50 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án — pass (2026-11-19 15:36:37 +07:00)

## Evidence

- `chk-focused` — pass (2026-11-19 15:34:50 +07:00): pnpm test:gates — exit 0
- `chk-suite` — pass (2026-11-19 15:36:37 +07:00): pnpm test — exit 0
