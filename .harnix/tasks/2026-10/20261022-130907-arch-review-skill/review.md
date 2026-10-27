# Tích hợp skill phân tích thiết kế kiến trúc doanh nghiệp harnix-arch-review

- **ID:** 20261022-130907-arch-review-skill
- **Mode:** full
- **Epic:** 20261022-130904-backend-harness-integration
- **Status:** completed/finishing
- **Created:** 2026-10-22 13:09:04 +07:00
- **Updated:** 2026-10-22 14:47:10 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 5/5 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Tạo skill mới src/skills/harnix-arch-review/ chuyển thể từ GST-Skills, bao gồm domain_briefs.json (tri thức ngành Pharma, Banking, E-commerce, Logistics), quy trình review WBS, gap analysis 3 chiều (Thừa/Thiếu/Chưa hợp lý) và chuẩn hóa bóc tách Backend Core vs BFF 15%, đóng epic với version bump 2.16.0.

## Non-goals

- Không thêm runtime Python hay dependency sinh file PPTX ngoài Node.js
- Không bắt buộc phải có WBS mới chạy được skill

## Relevant paths

- `CHANGELOG.md`
- `README.md`
- `docs/HARNIX_PRD.md`
- `docs/UPSTREAM_MAPPING.md`
- `package.json`
- `src/skills/harnix-arch-review/SKILL.md`
- `src/skills/harnix-arch-review/references/domain-briefs.md`
- `src/skills/harnix-arch-review/references/wbs-consolidation.md`
- `src/skills/technique-skills.ts`
- `test/unit/skills/technique-skills.test.ts`
- `test/workflow/skill-sources.test.ts`

## Relevant specs

- `docs/HARNIX_PRD.md`
- `docs/UPSTREAM_MAPPING.md`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +8 / -0 |
| `README.md` | modified | +1 / -1 |
| `docs/HARNIX_PRD.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/guides/technologies/database/postgresql.md` | modified | +1 / -1 |
| `src/guides/technologies/database/redis.md` | modified | +1 / -0 |
| `src/guides/technologies/database/relational.md` | modified | +6 / -6 |
| `src/guides/technologies/database/sqlserver.md` | modified | +1 / -1 |
| `src/guides/technologies/framework/spring.md` | modified | +8 / -7 |
| `src/guides/technologies/runtime/dotnet.md` | modified | +5 / -5 |
| `src/skills/harnix-arch-review/SKILL.md` | added | - |
| `src/skills/harnix-arch-review/references/domain-briefs.md` | added | - |
| `src/skills/harnix-arch-review/references/wbs-consolidation.md` | added | - |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/references/brownfield.md` | modified | +7 / -0 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +6 / -2 |
| `src/skills/harnix-plan/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/references/decision-discipline.md` | modified | +17 / -0 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-review/SKILL.md` | modified | +2 / -2 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +13 / -9 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +4 / -3 |
| `src/skills/technique-skills.ts` | modified | +10 / -0 |
| `test/platform/codex-global.test.ts` | modified | +1 / -1 |
| `test/unit/skills/technique-skills.test.ts` | modified | +7 / -17 |
| `test/workflow/guide-format.test.ts` | modified | +5 / -0 |
| `test/workflow/skill-sources.test.ts` | modified | +1 / -0 |

## Acceptance criteria

- [x] `ac-1` (met): src/skills/harnix-arch-review/SKILL.md (<=1,200 tokens, <=200 dòng, có ## Evidence and Rationale trích dẫn external-research.md) được tạo với quy trình: Detect/Research Domain, WBS Dynamic Extraction, 3-Way Gap Analysis trên 2 trục, 8-Layer System Overview (One BFF per Channel), và Core MAX-Dedup + BFF 15% kèm 3 ngoại lệ không áp dụng.
- [x] `ac-2` (met): Tạo src/skills/harnix-arch-review/references/domain-briefs.md và wbs-consolidation.md (mỗi file <=2,000 tokens, chỉ có SKILL.md và references/ trong thư mục skill), chứa tri thức 10 ngành (pharma, ecommerce, banking, insurance, logistics, healthcare, edtech, saas, manufacturing_iot, supply_chain) và công thức bóc tách WBS/BFF.
- [x] `ac-3` (met): Đăng ký harnix-arch-review (kèm references) làm technique skill thứ 7 trong src/skills/technique-skills.ts, cập nhật docs/HARNIX_PRD.md và docs/UPSTREAM_MAPPING.md.
- [x] `ac-4` (met): Cập nhật test/unit/skills/technique-skills.test.ts và test/workflow/skill-sources.test.ts; đạt exit code 0 với pnpm run test:gates và pnpm run test.
- [x] `ac-5` (met): Chạy pnpm version:sync 2.16.0 --fold-dev --summary 'Tích hợp tinh hoa Backend Harness và Architecture Review từ 04. Backend' đóng epic thành công.

## Required checks

- [x] `check-gates` (focused): Contract tests cho skills, docs và package — pass (2026-10-22 14:45:02 +07:00)
- [x] `check-suite` (full): Toàn bộ bộ test của dự án — pass (2026-10-22 14:46:49 +07:00)

## Decisions

- **dec-1** — Đăng ký harnix-arch-review vào src/skills/technique-skills.ts (technique skill thứ 7) và đặt tri thức 10 ngành vào references/domain-briefs.md thay vì assets/domain_briefs.json
  - _Why:_ Tuân thủ khóa cứng 6 workflowSkills trong catalog.ts và quy tắc chỉ cho phép SKILL.md + references/ trong test/workflow/skill-sources.test.ts:188, đồng thời giúp globalSkillDesiredFiles() tự động đóng gói lên cả 6 nền tảng

## Evidence

- `check-gates` — pass (2026-10-22 14:45:02 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-22 14:46:49 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
