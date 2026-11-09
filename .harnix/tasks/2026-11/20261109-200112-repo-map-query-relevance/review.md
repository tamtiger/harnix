# Sửa độ liên quan của repo-map --query khi có task đang active

- **ID:** 20261109-200112-repo-map-query-relevance
- **Mode:** full
- **Epic:** 20261109-194501-repo-map-insights
- **Status:** completed/finishing
- **Created:** 2026-11-09 20:01:10 +07:00
- **Updated:** 2026-11-09 22:43:20 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 3/3 passed |
| Residual risks | 2 | risk-ranker-change: medium, risk-neighbour-noise: low |

## Goal

Khiến --query xếp theo chuỗi truy vấn thay vì bị file và từ khóa của task đang active lấn át, và tìm được file theo từ trong tên file.

## Non-goals

- Không thêm embedding hay ngữ nghĩa; vẫn là từ vựng và đồ thị.
- Không đổi RepoMapV1 hay extractorVersion.
- Không thêm cờ mới (giảm trọng số bằng điều kiện thay vì cờ --no-task).

## Relevant paths

- `CHANGELOG.md`
- `README.md`
- `docs/HARNESS_RESEARCH.md`
- `docs/HARNIX_PRD.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `src/commands/repo-map-internal.ts`
- `src/core/repo-map/search-terms.ts`
- `src/core/repo-map/search.ts`
- `src/core/repo-map/service.ts`
- `test/support/repo-map-query-fixtures.ts`
- `test/unit/core/repo-map/search-terms.test.ts`
- `test/unit/core/repo-map/search.test.ts`
- `test/unit/core/repo-map/service.test.ts`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +18 / -0 |
| `README.md` | modified | +2 / -2 |
| `docs/HARNESS_RESEARCH.md` | modified | +1 / -1 |
| `docs/HARNIX_PRD.md` | modified | +1 / -1 |
| `docs/IMPLEMENTATION_PLAN.md` | modified | +6 / -2 |
| `docs/prompts/repo-graph-tools-research.md` | modified | +75 / -35 |
| `package.json` | modified | +1 / -1 |
| `src/commands/repo-map-internal.ts` | modified | +4 / -1 |
| `src/core/repo-map/extract-imports.ts` | added | - |
| `src/core/repo-map/extract-symbols.ts` | added | - |
| `src/core/repo-map/extract.ts` | modified | +39 / -58 |
| `src/core/repo-map/graph-references.ts` | added | - |
| `src/core/repo-map/graph.ts` | modified | +15 / -3 |
| `src/core/repo-map/impact.ts` | modified | +21 / -15 |
| `src/core/repo-map/references.ts` | added | - |
| `src/core/repo-map/refs.ts` | modified | +3 / -2 |
| `src/core/repo-map/search-terms.ts` | added | - |
| `src/core/repo-map/search.ts` | modified | +29 / -39 |
| `src/core/repo-map/service.ts` | modified | +56 / -26 |
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
| `test/support/repo-map-query-fixtures.ts` | added | - |
| `test/unit/core/repo-map/extract-imports.test.ts` | added | - |
| `test/unit/core/repo-map/extract-symbols.test.ts` | added | - |
| `test/unit/core/repo-map/extract.test.ts` | modified | +144 / -1 |
| `test/unit/core/repo-map/graph-references.test.ts` | added | - |
| `test/unit/core/repo-map/impact.test.ts` | modified | +8 / -2 |
| `test/unit/core/repo-map/references.test.ts` | added | - |
| `test/unit/core/repo-map/refs.test.ts` | modified | +1 / -0 |
| `test/unit/core/repo-map/search-terms.test.ts` | added | - |
| `test/unit/core/repo-map/search.test.ts` | added | - |

_(5 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): Các điểm cộng từ task đang active (relevantPaths, từ khóa task, file lân cận trong đồ thị) chỉ áp dụng cho file có lexical match với truy vấn, ở cả bước chọn seed và bước mở rộng đồ thị lẫn bonus xếp hạng; truy vấn không khớp file nào trả results rỗng thay vì 20 kết quả nhiễu.
- [x] `ac-2` (met): Từ ghép camelCase trong identifiers được tách khi lập chỉ mục từ vựng để truy vấn cache tìm được SessionCache; việc tách theo dấu gạch, gạch dưới, dấu chấm và gạch chéo trong đường dẫn (do MiniSearch làm sẵn) được khóa bằng test hồi quy; không đổi schema cache v1.
- [x] `ac-3` (met): Bộ truy vấn vàng tối thiểu 8 cặp (truy vấn, file mong đợi) lấy từ các session thật, chạy trên fixture repo có task active: file mong đợi nằm trong top 3; truy vấn vô nghĩa trả rỗng; tài liệu ghi ranker mới ở IMPLEMENTATION_PLAN mục 4.12 và rollback bằng git revert (nhánh ranker v1 đã bị gỡ); CHANGELOG, phiên bản 2.31.0-dev.3 bằng pnpm version:sync; pnpm run test:gates xanh.
- [x] `ac-4` (met): Khớp chính xác token identifier xếp trên khớp mờ và khớp tiền tố; khớp mờ chỉ áp dụng khi không có khớp chính xác; truy vấn một token dạng identifier mà chỉ mục không có thì trả kết quả theo cơ chế tra tham chiếu của --refs kèm nhãn fallback.

## Required checks

- [x] `chk-focused` (focused): Test đơn vị và tích hợp của độ liên quan --query — pass (2026-11-09 22:42:56 +07:00)
- [x] `chk-gates` (focused): Test hợp đồng CLI, tài liệu và kiến trúc — pass (2026-11-09 22:43:07 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án — pass (2026-11-09 22:42:48 +07:00)

## Decisions

- **dec-evidence-query** — Chặn điểm task khi không có lexical match thay vì thêm cờ.
  - _Why:_ Đo ngày 2026-11-09: truy vấn vô nghĩa vẫn trả 20 kết quả điểm 870 trở xuống, đúng bằng relevantPaths của task đang active (search.ts cộng 500, 100 mỗi từ khóa, 120 và 100 cho lân cận); truy vấn session cache đặt graph.ts lên đầu và bỏ sót session-cache.ts.
- **dec-evidence-exact** — Khớp chính xác phải thắng khớp mờ.
  - _Why:_ Đo trên payment_hub: truy vấn PaymentRequestCode trả 20 file nhưng chỉ 1 file thật sự chứa chuỗi; ProviderTransactionCode trả 1 file không chứa. Phần lớn do khớp mờ và tiền tố trên tên file.
- **dec-premise-tokenizer** — Bỏ yêu cầu lập chỉ mục token từ tên file: MiniSearch đã tách đường dẫn.
  - _Why:_ Kiểm chứng ngày 2026-11-09: MiniSearch mặc định tách theo gạch, chấm, gạch dưới, gạch chéo; truy vấn session cache khớp session-cache.ts. Nguyên nhân thật là điểm cộng task ở bước seed và rank (search.ts), nên chặn ở cả hai nơi.

## Residual risks

- **risk-ranker-change** (medium) — Đổi trọng số xếp hạng có thể làm các truy vấn hiện dùng đổi thứ tự; giảm thiểu bằng bộ truy vấn vàng và ghi chú rollback ranker v1.
- **risk-neighbour-noise** (low) — Truy vấn một tên thuộc tính trả file khai báo đúng tên cùng hàng xóm đồ thị (độ chính xác khoảng 25 phần trăm trên payment_hub, 5 trên 20 file chứa tên); đó là thiết kế của ranker hiện có, cần --refs để liệt kê nơi dùng.

## Evidence

- `chk-suite` — pass (2026-11-09 22:42:48 +07:00): pnpm test — exit 0
- `chk-focused` — pass (2026-11-09 22:42:56 +07:00): pnpm exec vitest run repo-map — exit 0
- `chk-gates` — pass (2026-11-09 22:43:07 +07:00): pnpm test:gates — exit 0
