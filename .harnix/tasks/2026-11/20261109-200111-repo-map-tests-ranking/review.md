# Sửa thứ hạng repo-map --tests để test trực tiếp luôn đứng đầu

- **ID:** 20261109-200111-repo-map-tests-ranking
- **Mode:** full
- **Epic:** 20261109-194501-repo-map-insights
- **Status:** completed/finishing
- **Created:** 2026-11-09 20:01:10 +07:00
- **Updated:** 2026-11-09 22:32:35 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Khiến harnix repo-map --tests <path> trả test liên quan nhất trước, để agent chạy đúng test hẹp thay vì quay về ls và grep.

## Non-goals

- Không đổi RepoMapV1 hay cách dựng đồ thị import.
- Không bỏ thông tin bắc cầu, chỉ xếp sau.

## Relevant paths

- `CHANGELOG.md`
- `README.md`
- `docs/HARNIX_PRD.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `src/core/repo-map/test-convention.ts`
- `src/core/repo-map/tests.ts`
- `test/unit/core/repo-map/test-convention.test.ts`
- `test/unit/core/repo-map/tests-ranking.test.ts`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +12 / -0 |
| `README.md` | modified | +2 / -2 |
| `docs/HARNESS_RESEARCH.md` | modified | +1 / -1 |
| `docs/HARNIX_PRD.md` | modified | +1 / -1 |
| `docs/IMPLEMENTATION_PLAN.md` | modified | +4 / -3 |
| `docs/prompts/repo-graph-tools-research.md` | modified | +75 / -35 |
| `package.json` | modified | +1 / -1 |
| `src/commands/repo-map-internal.ts` | modified | +3 / -1 |
| `src/core/repo-map/extract-imports.ts` | added | - |
| `src/core/repo-map/extract-symbols.ts` | added | - |
| `src/core/repo-map/extract.ts` | modified | +39 / -58 |
| `src/core/repo-map/graph-references.ts` | added | - |
| `src/core/repo-map/graph.ts` | modified | +15 / -3 |
| `src/core/repo-map/impact.ts` | modified | +21 / -15 |
| `src/core/repo-map/references.ts` | added | - |
| `src/core/repo-map/refs.ts` | modified | +3 / -2 |
| `src/core/repo-map/service.ts` | modified | +9 / -20 |
| `src/core/repo-map/store.ts` | modified | +50 / -8 |
| `src/core/repo-map/test-convention.ts` | added | - |
| `src/core/repo-map/tests.ts` | modified | +83 / -110 |
| `src/core/repo-map/types.ts` | modified | +14 / -1 |
| `src/core/workflow/context.ts` | modified | +2 / -2 |
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
| `test/integration/commands/repo-map-internal.test.ts` | modified | +3 / -3 |
| `test/migration/repo-map-extractor-v2.test.ts` | added | - |
| `test/support/repo-map-fixtures.ts` | added | - |
| `test/unit/core/repo-map/extract-imports.test.ts` | added | - |
| `test/unit/core/repo-map/extract-symbols.test.ts` | added | - |
| `test/unit/core/repo-map/extract.test.ts` | modified | +144 / -1 |
| `test/unit/core/repo-map/graph-references.test.ts` | added | - |
| `test/unit/core/repo-map/impact.test.ts` | modified | +8 / -2 |
| `test/unit/core/repo-map/references.test.ts` | added | - |
| `test/unit/core/repo-map/refs.test.ts` | modified | +1 / -0 |
| `test/unit/core/repo-map/store.test.ts` | modified | +7 / -10 |
| `test/unit/core/repo-map/test-convention.test.ts` | added | - |
| `test/unit/core/repo-map/tests.test.ts` | modified | +128 / -0 |
| `test/workflow/self-host.test.ts` | modified | +1 / -1 |

## Acceptance criteria

- [x] `ac-1` (met): repo-map --tests xếp kết quả theo bậc: (1) test cùng tên hoặc phản chiếu cấu trúc thư mục theo quy ước từng ngôn ngữ (src/a/b.ts với test/unit/a/b.test.ts; Foo.cs với FooTests.cs hoặc FooTest.cs, kể cả trong project X.Tests; Foo.php với FooTest.php; foo.py với test_foo.py), kể cả khi test đó cũng import file đích, (2) test import hoặc tham chiếu trực tiếp file đích, (3) test trùng symbol đặc trưng, (4) test bắc cầu; trong mỗi bậc xếp theo code-unit; test bậc 1 luôn đứng trước test bậc 2 nên không bị cắt bởi --limit khi file được hàng chục test import.
- [x] `ac-2` (met): Output giữ tests là mảng đường dẫn (tương thích) và thêm reasons ánh xạ đường dẫn tới bậc (convention, direct, symbol, transitive); bậc bắc cầu tối đa 5 test; bước trùng symbol không đẩy test bậc 1 và 2 ra khỏi --limit; test không có liên hệ nào không được trả (đo thực tế: --tests một AppService C# trả 20 test không liên quan); harnix verify-plan --impact dùng cùng thứ hạng vì gọi chung findAffectedTests. Fixture TypeScript, C#/ABP và PHP có test: test viết cho file nằm trong top 5.
- [x] `ac-3` (met): Hành vi xếp hạng và trường reasons mới được đồng bộ trong PRD, README, skill liên quan, CHANGELOG và test hợp đồng CLI; phiên bản nâng lên 2.31.0-dev.2 bằng pnpm version:sync; pnpm run test:gates xanh.

## Required checks

- [x] `chk-focused` (focused): Test đơn vị và tích hợp của xếp hạng --tests — pass (2026-11-09 22:32:18 +07:00)
- [x] `chk-gates` (focused): Test hợp đồng CLI, tài liệu và kiến trúc — pass (2026-11-09 22:32:27 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án — pass (2026-11-09 22:32:10 +07:00)

## Decisions

- **dec-evidence-tests** — Sửa --tests trước mọi tính năng mới.
  - _Why:_ Đo ngày 2026-11-09 trên 5 file mẫu: cả 5 lần --tests trả đủ 20 test, truncated, và không có test trực tiếp vì sắp theo khoảng cách rồi bảng chữ cái (integration đứng trước unit).
- **dec-convention-first** — Bậc convention đứng trước direct.
  - _Why:_ File trung tâm có hàng chục test import trực tiếp; test được đặt tên cho file là liên hệ chính xác nhất nên phải đứng đầu, còn importers sắp theo code-unit phía sau.

## Evidence

- skipped (2026-11-09 22:25:39 +07:00): Task contract revised at persisted replan: Đo thực tế ngày 2026-11-09: file trung tâm như store.ts có hơn 20 test import trực tiếp; xếp direct trước convention làm test đơn vị rơi xuống vị trí 18 (store) hoặc bị cắt hẳn (text-integrity), nên convention phải đứng trước.
- skipped (2026-11-09 22:25:40 +07:00): Task contract revised at persisted replan: Đồng bộ với thứ tự bậc mới: convention trước direct.
- `chk-suite` — pass (2026-11-09 22:32:10 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-focused` — pass (2026-11-09 22:32:18 +07:00): pnpm exec vitest run repo-map — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-gates` — pass (2026-11-09 22:32:27 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
