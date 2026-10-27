# Làm giàu bộ hướng dẫn kỹ thuật Spring Boot, .NET và Relational Database

- **ID:** 20261022-130905-enrich-backend-guides
- **Mode:** lite
- **Epic:** 20261022-130904-backend-harness-integration
- **Status:** completed/finishing
- **Created:** 2026-10-22 13:09:04 +07:00
- **Updated:** 2026-10-22 14:25:25 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 5/5 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Bổ sung các enterprise pattern thực chiến từ 04. Backend vào src/guides/technologies/ (spring.md, dotnet.md, relational.md, postgresql.md, sqlserver.md): Base Entity auditable, soft-delete với partial index, optimistic locking (@Version / concurrency token), N+1 prevention (JOIN FETCH, EntityGraph, AsSplitQuery, BatchSize), chuẩn mã lỗi DOMAIN_ACTION_REASON, và expand/contract migration; đảm bảo vượt qua toàn bộ test:gates và giới hạn token/section.

## Non-goals

- Không vượt quá 600 token, 10 constraints và 6 common mistakes mỗi guide
- Không thay đổi định dạng 3 section chuẩn của guide

## Relevant paths

- `CHANGELOG.md`
- `README.md`
- `package.json`
- `src/guides/technologies/database/postgresql.md`
- `src/guides/technologies/database/redis.md`
- `src/guides/technologies/database/relational.md`
- `src/guides/technologies/database/sqlserver.md`
- `src/guides/technologies/framework/spring.md`
- `src/guides/technologies/runtime/dotnet.md`
- `test/workflow/guide-format.test.ts`

## Relevant specs

- `docs/HARNIX_PRD.md`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +6 / -0 |
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
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +1 / -1 |
| `test/workflow/guide-format.test.ts` | modified | +5 / -0 |

## Acceptance criteria

- [x] `ac-1` (met): spring.md được làm giàu (<=10 constraints, <=6 mistakes, <=600 tokens): BaseEntity auditable, cấm @Data trên JPA entity, soft-delete (@SQLDelete/@SQLRestriction), optimistic locking @Version, @BatchSize, mã lỗi DOMAIN_ACTION_REASON, BCrypt>=12, refresh token rotation và PII masking.
- [x] `ac-2` (met): dotnet.md được làm giàu (giữ RequireAuthorization, <=10 constraints, <=6 mistakes, <=600 tokens): EF Core AsSplitQuery, HasQueryFilter cho soft-delete, concurrency token (IsRowVersion), mã lỗi DOMAIN_ACTION_REASON với ProblemDetails, và structured logging kèm PII masking.
- [x] `ac-3` (met): relational.md, postgresql.md, sqlserver.md và redis.md được làm giàu (trong trần bullet/token): khóa theo thứ tự ID tăng dần chống deadlock, chia chunk batch ngắn, partial/filtered index cho soft-delete, UUIDv7, pool sizing (2*cores)+1, và phòng chống cache stampede/dual-write inconsistency.
- [x] `ac-4` (met): Bổ sung test assertions kiểm chứng các quy tắc mới vào test/workflow/guide-format.test.ts và đạt exit code 0 với pnpm run test:gates.
- [x] `ac-5` (met): Chạy pnpm version:sync 2.16.0-dev.1 ghi nhận tóm tắt thay đổi vào CHANGELOG.md.

## Required checks

- [x] `check-gates` (focused): Contract tests (cấu trúc guide, token budget, format) — pass (2026-10-22 14:23:33 +07:00)
- [x] `check-suite` (full): Toàn bộ bộ test của dự án — pass (2026-10-22 14:25:07 +07:00)

## Decisions

- **dec-1** — Gộp các pattern mới vào trong giới hạn <=10 Constraints, <=6 Common mistakes và <=600 tokens của mỗi guide, đồng thời dùng @SQLRestriction thay cho @Where đã deprecated trên Hibernate 6.2+
  - _Why:_ Bảo đảm tuân thủ tuyệt đối test/workflow/guide-format.test.ts và chuẩn Spring Boot 3.x hiện đại

## Evidence

- skipped (2026-10-22 13:52:07 +07:00): Task contract revised at persisted replan: Cập nhật tiêu chí và phạm vi Task 1 sau khi subagent đọc sâu 04. Backend và kiểm tra trần 10 constraints / 600 tokens của guide-format.test.ts
- `check-gates` — pass (2026-10-22 14:23:33 +07:00): pnpm test:gates — exit 0
- `check-suite` — pass (2026-10-22 14:25:07 +07:00): pnpm test — exit 0
