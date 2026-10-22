# Nâng cấp an toàn migration DB ứng dụng, nhận diện anti-pattern bảo mật và ma trận quyền hạn

- **ID:** 20261022-130906-harness-safety-guardrails
- **Mode:** lite
- **Epic:** 20261022-130904-backend-harness-integration
- **Status:** completed/finishing
- **Created:** 2026-10-22 13:09:04 +07:00
- **Updated:** 2026-10-22 14:35:11 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 5/5 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Mở rộng harnix-migration-safety bao hàm an toàn migration database ứng dụng (bắt buộc rollback test pass, cấm thao tác DB production trực tiếp), mở rộng harnix-security-lens và harnix-review phát hiện các anti-pattern (nối chuỗi SQL, logging debug thay vì structured logger), và bổ sung ma trận 3 vùng quyền (Autonomous / Review-required / Blocked) vào harnix-plan và harnix-implement.

## Non-goals

- Không thêm dependencies ngoài
- Không phá vỡ các contract immutability của task

## Relevant paths

- `CHANGELOG.md`
- `README.md`
- `package.json`
- `src/skills/harnix-implement/references/brownfield.md`
- `src/skills/harnix-migration-safety/SKILL.md`
- `src/skills/harnix-plan/SKILL.md`
- `src/skills/harnix-plan/references/decision-discipline.md`
- `src/skills/harnix-review/SKILL.md`
- `src/skills/harnix-security-lens/SKILL.md`
- `src/skills/harnix-verify/SKILL.md`
- `test/unit/skills/technique-skills.test.ts`
- `test/workflow/skill-sources.test.ts`

## Relevant specs

- `docs/HARNIX_WORKFLOW.md`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +12 / -0 |
| `README.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/guides/technologies/database/postgresql.md` | modified | +1 / -1 |
| `src/guides/technologies/database/redis.md` | modified | +1 / -0 |
| `src/guides/technologies/database/relational.md` | modified | +6 / -6 |
| `src/guides/technologies/database/sqlserver.md` | modified | +1 / -1 |
| `src/guides/technologies/framework/spring.md` | modified | +8 / -7 |
| `src/guides/technologies/runtime/dotnet.md` | modified | +5 / -5 |
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
| `test/workflow/guide-format.test.ts` | modified | +5 / -0 |

## Acceptance criteria

- [x] `ac-1` (met): harnix-migration-safety/SKILL.md (<=1,200 tokens) bổ sung Application Database Migrations: mẫu expand-contract, bắt buộc rollback/down test pass trước khi hoàn tất verify, và cấm chạy migration trực tiếp lên production DB.
- [x] `ac-2` (met): harnix-security-lens/SKILL.md (<=1,200 tokens) và harnix-review/SKILL.md (<=2,000 tokens) bổ sung 3 content rules (cấm nối chuỗi SQL, cấm System.out.print/Console.Write thay vì structured logger, bảo vệ secret/.env/*.pem), kiểm tra IDOR resource ownership và PII masking trong log.
- [x] `ac-3` (met): Đặt Ma trận 3 vùng quyền hạn (Autonomous / Review-required / Blocked), 4 điều kiện kích hoạt Harden bắt buộc, thứ tự triển khai Backend và Observability log line vào harnix-plan/references/decision-discipline.md, harnix-implement/references/brownfield.md và harnix-verify/SKILL.md (giữ harnix-plan/SKILL.md <=2,000 tokens).
- [x] `ac-4` (met): Bổ sung test assertions vào test/workflow/skill-sources.test.ts và test/unit/skills/technique-skills.test.ts; đạt exit code 0 với pnpm run test:gates và pnpm run test.
- [x] `ac-5` (met): Chạy pnpm version:sync 2.16.0-dev.2 cập nhật CHANGELOG.md.

## Required checks

- [x] `check-gates` (focused): Contract tests cho skills, instruction budget và workflow — pass (2026-10-22 14:33:05 +07:00)
- [x] `check-suite` (full): Toàn bộ bộ test của dự án — pass (2026-10-22 14:34:44 +07:00)

## Decisions

- **dec-1** — Đặt Ma trận 3 vùng quyền hạn và điều kiện Harden vào harnix-plan/references/decision-discipline.md thay vì harnix-plan/SKILL.md (đang ở 1,994/2,000 tokens)
  - _Why:_ Tránh vượt trần 2,000 tokens của instruction-budget.test.ts trong khi vẫn giữ đầy đủ capability cho harnix-plan

## Evidence

- `check-gates` — pass (2026-10-22 14:33:05 +07:00): pnpm test:gates — exit 0
- `check-suite` — pass (2026-10-22 14:34:44 +07:00): pnpm test — exit 0
