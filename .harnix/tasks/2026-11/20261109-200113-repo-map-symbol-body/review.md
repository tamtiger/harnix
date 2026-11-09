# Thêm repo-map --outline --symbol --body để đọc thân symbol

- **ID:** 20261109-200113-repo-map-symbol-body
- **Mode:** full
- **Epic:** 20261109-194501-repo-map-insights
- **Status:** completed/finishing
- **Created:** 2026-11-09 20:01:10 +07:00
- **Updated:** 2026-11-09 22:51:44 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 3/3 passed |
| Residual risks | 2 | risk-outline-size: low, risk-redaction-overreach: low |

## Goal

Cho agent đọc đúng thân một symbol (có giới hạn dòng) thay vì lặp lại sed -n trên các file lớn.

## Non-goals

- Không thêm công cụ sửa symbol (replace, insert).
- Không đọc file ngoài workspace hay theo symlink thoát root.

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

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +24 / -0 |
| `README.md` | modified | +2 / -2 |
| `docs/HARNESS_RESEARCH.md` | modified | +2 / -2 |
| `docs/HARNIX_PRD.md` | modified | +1 / -1 |
| `docs/IMPLEMENTATION_PLAN.md` | modified | +8 / -2 |
| `docs/prompts/repo-graph-tools-research.md` | modified | +75 / -35 |
| `package.json` | modified | +1 / -1 |
| `src/cli-helpers.ts` | modified | +11 / -3 |
| `src/cli-workflow-commands.ts` | modified | +1 / -0 |
| `src/commands/repo-map-internal.ts` | modified | +13 / -2 |
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
| `src/core/repo-map/refs.ts` | modified | +3 / -2 |
| `src/core/repo-map/search-terms.ts` | added | - |
| `src/core/repo-map/search.ts` | modified | +29 / -39 |
| `src/core/repo-map/service.ts` | modified | +61 / -26 |
| `src/core/repo-map/store.ts` | modified | +50 / -8 |
| `src/core/repo-map/test-convention.ts` | added | - |
| `src/core/repo-map/tests.ts` | modified | +83 / -110 |
| `src/core/repo-map/types.ts` | modified | +21 / -1 |
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
| `test/unit/cli-helpers.test.ts` | modified | +17 / -0 |
| `test/unit/core/repo-map/extract-imports.test.ts` | added | - |
| `test/unit/core/repo-map/extract-symbols.test.ts` | added | - |
| `test/unit/core/repo-map/extract.test.ts` | modified | +144 / -1 |

_(13 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): harnix repo-map --outline <path> --symbol <name> --body trả, với mỗi symbol khớp, startLine, endLine và các dòng nguồn từ startLine đến endLine; tổng số dòng nguồn bị chặn ở 200 kèm trường truncated; --limit vẫn đếm số symbol (không đếm dòng); tên trùng nhiều symbol được trả theo thứ tự xuất hiện trong phạm vi tổng 200 dòng.
- [x] `ac-2` (met): Dòng nguồn trả về bị che toàn dòng thành [redacted] (giữ nguyên số dòng) khi khớp bộ mẫu secret mạnh hơn bộ lọc outline: khóa kiểu 'password' => '...', JSON "password": "...", gán chỉ mục mảng như $db['default']['password'] = '...', chuỗi kết nối có mật khẩu, Bearer token và khối private key; test riêng cho từng dạng (bộ lọc hiện có bỏ sót 3 trong 5 dạng này).
- [x] `ac-3` (met): --body bị từ chối khi đường dẫn bị .gitignore hoặc .harnixignore loại, hoặc là file cấu hình nhạy cảm (.env*, appsettings.secrets.json, application/config/database.php); đường dẫn được xác thực an toàn như --outline (chống traversal, symlink thoát root); --body không kèm --symbol bị từ chối bằng lỗi có hint nêu lệnh đúng; không đổi schema cache v1.
- [x] `ac-4` (met): PRD, README, skill liên quan, CHANGELOG và test hợp đồng CLI được đồng bộ cho cờ --body; phiên bản nâng lên 2.31.0-dev.4 bằng pnpm version:sync; pnpm run test:gates xanh.

## Required checks

- [x] `chk-focused` (focused): Test đơn vị và tích hợp của --body — pass (2026-11-09 22:51:26 +07:00)
- [x] `chk-gates` (focused): Test hợp đồng CLI, tài liệu và kiến trúc — pass (2026-11-09 22:51:35 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án — pass (2026-11-09 22:51:18 +07:00)

## Decisions

- **dec-evidence-body** — Đọc thân symbol có giới hạn là tính năng giảm token có bằng chứng nhất.
  - _Why:_ Repo PHP thật (49 session) có 2.242 lệnh sed -n, trung vị 36 dòng, p90 91 dòng; 168 trên 432 file bị đọc lại từ 4 lần trở lên, riêng một file model bị đọc hơn 90 lần. Repo Python có trung vị 130 dòng.
- **dec-body-module** — Phần --body nằm trong module riêng outline-body.ts.
  - _Why:_ outline.ts hiện 295 trên 300 dòng code; bộ lọc secret hiện có (outline.ts) chỉ dùng để bỏ dòng khỏi việc dò khai báo, chưa từng che dòng nguồn nên không dùng lại được cho --body.

## Residual risks

- **risk-outline-size** (low) — outline.ts đã gần giới hạn 300 dòng code; phần --body cần module riêng.
- **risk-redaction-overreach** (low) — Bộ che secret ưu tiên che thừa nên có thể che nhầm dòng chỉ trông giống credential (ví dụ password = request.password); chấp nhận vì thân đi thẳng vào ngữ cảnh agent.

## Evidence

- `chk-suite` — pass (2026-11-09 22:51:18 +07:00): pnpm test — exit 0
- `chk-focused` — pass (2026-11-09 22:51:26 +07:00): pnpm exec vitest run repo-map — exit 0
- `chk-gates` — pass (2026-11-09 22:51:35 +07:00): pnpm test:gates — exit 0
