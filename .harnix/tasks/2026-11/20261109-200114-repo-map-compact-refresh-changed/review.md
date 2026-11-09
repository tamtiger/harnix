# Rút gọn output repo-map, giới hạn --refresh và kích hoạt agent dùng repo-map

- **ID:** 20261109-200114-repo-map-compact-refresh-changed
- **Mode:** full
- **Epic:** 20261109-194501-repo-map-insights
- **Status:** completed/finishing
- **Created:** 2026-11-09 20:01:10 +07:00
- **Updated:** 2026-11-10 00:09:11 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 5/5 met or waived |
| Required checks | 100% | 4/4 passed |
| Residual risks | 3 | risk-no-tests-repo: low, risk-literal-queries: medium, risk-his-index-limit: low |

## Goal

Làm output repo-map gọn hơn grep ở mọi chế độ, chặn output --refresh phình, và tạo cơ chế để agent chủ động dùng repo-map (chỉ thị trong skill, một dòng trong khối AGENTS, một dòng gợi ý tĩnh trong hook context); đóng epic bằng bản phát hành 2.31.0. Không làm --changed vì verify-plan --impact đã có.

## Non-goals

- Không chạy git ghi và không giữ khóa index.
- Không thêm tokenizer hay tham số ngân sách token.
- Không làm cycles, hubs hay unused.

## Relevant paths

- `CHANGELOG.md`
- `README.md`
- `docs/HARNIX_PRD.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/RULE_OWNERSHIP.md`
- `src/cli-helpers.ts`
- `src/cli-workflow-commands.ts`
- `src/commands/repo-map-internal.ts`
- `src/core/context/effective-context.ts`
- `src/core/repo-map/compact.ts`
- `src/core/repo-map/refresh-summary.ts`
- `src/core/repo-map/workspace.ts`
- `src/skills/harnix-debug/SKILL.md`
- `src/skills/harnix-implement/SKILL.md`
- `src/skills/harnix-plan/SKILL.md`
- `src/templates/harnix/activation.ts`
- `src/templates/harnix/token-budgets.json`
- `test/unit/core/context/effective-context.test.ts`
- `test/unit/core/repo-map/compact.test.ts`
- `test/unit/core/repo-map/refresh-summary.test.ts`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +2 / -2 |
| `CHANGELOG.md` | modified | +13 / -0 |
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

- [x] `ac-1` (met): --format compact được chấp nhận cho --outline, --refs, --impact và --tests: mỗi mục là một chuỗi ngắn (refs là path:line kind, impact là path@khoảng cách, tests là path kèm bậc, outline là tên kiểu dòng đầu-dòng cuối), vẫn một JSON document và nhỏ hơn bản json; --format outline chỉ dùng với --query; --body không đi cùng --format compact; --format với --refresh hoặc --events bị từ chối bằng lỗi có hint nêu các chế độ hợp lệ.
- [x] `ac-2` (met): --refresh trả records, scope, status, skippedTotal, limitReached (cờ riêng thay cho marker "limit" trộn trong mảng) và tối đa 10 đường dẫn bị bỏ qua không phải file nhạy cảm (.env*, secrets); output bị chặn kích thước ngay cả khi hàng nghìn file bị bỏ qua; trường skipped cũ vẫn là mảng nhưng bị cắt còn 10 và ghi rõ trong tài liệu; refresh theo --workspace và init dùng cùng định dạng; test hợp đồng và golden liên quan được cập nhật.
- [x] `ac-4` (met): Chỉ thị kích hoạt dùng repo-map (trước grep -r một symbol dùng --refs; trước sed -n lần hai trên cùng file dùng --outline --symbol --body; trước khi chạy test dùng --tests) được thêm vào skill harnix-plan, harnix-implement và harnix-debug, và thành một dòng trong khối AGENTS luôn nạp; token-budgets.json nâng alwaysLoaded và skills.harnix-plan có quyết định ghi lại (hiện 1459/1500 và 1662/1700), docs/RULE_OWNERSHIP.md có dòng tương ứng, Cursor (không có file instruction toàn cục) chỉ nhận qua skill và OpenCode, Cursor không có hook được ghi rõ; test instruction-budget, rule-ownership và skill-sources xanh.
- [x] `ac-6` (met): PRD, README, CHANGELOG và test hợp đồng CLI được đồng bộ, phiên bản đóng epic 2.31.0 bằng pnpm version:sync --fold-dev, và pnpm run test:gates xanh.
- [x] `ac-5` (met): Hook context ở chế độ lean tăng không quá 35 token so với golden hiện tại (đo hôm nay: planning 393, inProgress 200) bằng một dòng gợi ý tĩnh nêu các lệnh repo-map hữu ích; dòng này không chạy repo-map và không đọc cache; chế độ full và các nền tảng hookless không đổi; test và golden liên quan được cập nhật đúng chuỗi mới.

## Required checks

- [x] `chk-focused` (focused): Test đơn vị và tích hợp của compact, refresh và --changed — pass (2026-11-10 00:08:40 +07:00)
- [x] `chk-gates` (focused): Test hợp đồng CLI, tài liệu, kiến trúc và ngân sách skill — pass (2026-11-10 00:08:48 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án — pass (2026-11-10 00:08:31 +07:00)
- [x] `chk-hook` (focused): Test hook context có dòng gợi ý repo-map tĩnh — pass (2026-11-10 00:08:54 +07:00)

## Decisions

- **dec-evidence-refresh** — Chặn output --refresh và cho --format dùng được ở mọi chế độ.
  - _Why:_ Ở repo PHP thật --refresh trả 17.929 và 19.274 byte (danh sách skipped gồm cả tên .env.*); agent gõ --outline --format compact và bị lỗi vì --format chỉ nhận --query; --refs trả 2.326 byte so với 1.426 byte của grep -rn.
- **dec-git-readonly** — Cho phép --changed gọi git đọc (status, diff) qua src/utils/git.js.
  - _Why:_ Có tiền lệ verify-plan --changed và code-impact; không vi phạm cấm tích hợp Git tự động vì không ghi và không commit.
- **dec-activation** — Cơ chế kích hoạt: chỉ thị trong skill, một dòng trong khối AGENTS luôn nạp, và một dòng gợi ý tĩnh trong hook context lean.
  - _Why:_ Người dùng duyệt ngày 2026-11-09 việc nâng hoặc đổi chỗ ngân sách alwaysLoaded (1500) và thêm dòng hook tĩnh. Hook không chạy repo-map nên không vi phạm cấm hook gọi repo-map; PreToolUse bị loại vì đổi giao thức hook và không đồng đều giữa các nền tảng. Chỉ làm sau khi tests-ranking và query-relevance sửa chất lượng.
- **dec-drop-changed** — Bỏ --changed khỏi epic.
  - _Why:_ verify-plan --impact (không có path) đã lấy file đổi từ git, gọi findAffectedTests và trả test cùng lệnh test hẹp (verify-plan.ts:144-200), và đã được skill implement và verify nhắc tới; thứ hạng mới của member tests-ranking cải thiện cả hai. Repo PHP his không có test tự động nên giá trị chỉ ở repo harnix.
- **dec-budget-always-loaded** — Nâng trần alwaysLoaded từ 1500 lên 1540 token; trần skills.harnix-plan giữ 1700.
  - _Why:_ Người dùng duyệt ngày 2026-11-09 việc nâng hoặc đổi chỗ ngân sách để thêm chỉ thị repo-map vào khối AGENTS. Đo bằng pnpm measure:tokens: alwaysLoaded 1460 thành 1508 (+48), harnix-plan 1665 thành 1689, hook lean +33 token (dưới ngưỡng 35). Biên còn 32 token cho các thay đổi sau.

## Residual risks

- **risk-no-tests-repo** (low) — Repo PHP thực tế không có bộ test tự động nên --changed và --tests ít giá trị ở đó; giá trị chủ yếu cho repo JS, TS, Python.
- **risk-literal-queries** (medium) — Chưa phục vụ truy vấn OR nhiều từ miền và literal (ví dụ THU1|MedCategoryCode, 69% mẫu Grep ở his); repo-map không gọn hơn grep ở nhu cầu này. Giảm thiểu: đo lại bằng transcript sau phát hành; chỉ mục literal cần extractorVersion tiếp theo.
- **risk-his-index-limit** (low) — Ở bản sao repo his, refresh báo limitReached true: chỉ mục chạm trần kích thước (50 MB) nên một phần file không được lập chỉ mục; chưa đổi trần vì ngoài phạm vi epic, cần task riêng nếu muốn.

## Evidence

- `chk-suite` — pass (2026-11-10 00:08:31 +07:00): pnpm test — exit 0 _(3 earlier reruns not shown; see task.json for full history)_
- `chk-focused` — pass (2026-11-10 00:08:40 +07:00): pnpm exec vitest run repo-map — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-gates` — pass (2026-11-10 00:08:48 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-hook` — pass (2026-11-10 00:08:54 +07:00): pnpm exec vitest run context — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
