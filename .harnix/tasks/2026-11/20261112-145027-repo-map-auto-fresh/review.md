# Repo-map tự phát hiện và làm mới cache cũ khi truy vấn

- **ID:** 20261112-145027-repo-map-auto-fresh
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-11-12 14:50:27 +07:00
- **Updated:** 2026-11-12 15:03:38 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 3/3 passed |
| Residual risks | 2 | r-cost: medium, r-readonly: low |

## Goal

Các lệnh repo-map (--query, --refs, --outline, --tests, --impact) không còn trả dữ liệu cũ một cách im lặng: phát hiện cache lệch với mã nguồn bằng kiểm tra rẻ, tự làm mới một lần rồi trả kết quả đúng, báo freshness khi không làm mới được, có cờ --cached để bỏ qua, và hook vẫn không bao giờ chạy repo-map.

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -1 |
| `CHANGELOG.md` | modified | +12 / -0 |
| `README.md` | modified | +28 / -28 |
| `docs/HARNIX_PRD.md` | modified | +4 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/cli-helpers.ts` | modified | +8 / -1 |
| `src/cli-workflow-commands.ts` | modified | +1 / -0 |
| `src/commands/internal-context.ts` | modified | +8 / -16 |
| `src/commands/repo-map-internal.ts` | modified | +12 / -0 |
| `src/core/context/effective-context.ts` | modified | +5 / -3 |
| `src/core/repo-map/freshness.ts` | added | - |
| `src/core/repo-map/inventory.ts` | modified | +30 / -10 |
| `src/core/repo-map/types.ts` | modified | +2 / -0 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-review/SKILL.md` | modified | +2 / -2 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +1 / -1 |
| `src/templates/harnix/activation.ts` | modified | +1 / -1 |
| `test/integration/scenarios/repo-map-freshness.test.ts` | added | - |
| `test/unit/core/context/effective-context.test.ts` | modified | +4 / -3 |
| `test/unit/core/repo-map/freshness.test.ts` | added | - |
| `test/workflow/cli-contract.test.ts` | modified | +1 / -0 |
| `test/workflow/internal-context-boundary.test.ts` | modified | +43 / -1 |

## Acceptance criteria

- [x] `ac-1` (met): Hàm kiểm tra độ mới của repo-map phát hiện file thêm, sửa, xóa so với cache mà không ghi gì và chỉ đọc nội dung các file ứng viên (mtime mới hơn cache hoặc khác kích thước), không đọc file không đổi.
- [x] `ac-2` (met): Khi cache cũ, các lệnh repo-map --query, --refs, --outline, --tests và --impact tự làm mới cache đúng một lần rồi trả kết quả từ dữ liệu mới kèm freshness refreshed; khi cache còn mới thì output giữ nguyên, không có trường freshness và không ghi cache.
- [x] `ac-3` (met): Cờ --cached dùng cache nguyên trạng, không kiểm tra và không ghi; khi làm mới thất bại hoặc vượt giới hạn, lệnh vẫn trả dữ liệu cũ với freshness stale cùng hint --refresh, không ném lỗi và giữ mã thoát 0; hook context vẫn không gọi repo-map.
- [x] `ac-4` (met): Hợp đồng CLI, tài liệu (README, AGENTS.md, PRD, workflow, skill) và test cấu trúc được đồng bộ, trần token không vượt, phiên bản được bump một lần.

## Required checks

- [x] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-11-12 15:03:22 +07:00)
- [x] `chk-fresh-2` (focused): Replacement for chk-fresh — pass (2026-11-12 15:01:25 +07:00)
- [x] `chk-gates` (focused): chk-gates — pass (2026-11-12 15:01:34 +07:00)

## Decisions

- **d-auto-refresh** — Truy vấn tự làm mới cache cũ đúng một lần (refresh đầy đủ), có cờ --cached để bỏ qua; không chỉ cảnh báo.
  - _Why:_ Cảnh báo suông khiến agent vẫn không tin kết quả và quay lại Grep; người dùng đã chấp nhận khuyến nghị tự làm mới.
- **d-no-schema-change** — Phát hiện cũ bằng mtime (không lưu vào cache) cộng băm các file ứng viên, không đổi schema repo-map-v1.json; refresh gia tăng thật sự để ngoài phạm vi.
  - _Why:_ usedNames không được cache nên làm mới gia tăng cần đọc lại mọi file; đổi schema cache là việc lớn hơn và chỉ đáng làm nếu đo thấy refresh đầy đủ quá chậm.
- **trace-freshness-timing** — Đo trên bản sao payment-hub (4.304 file, 168 MB, Windows): refresh đầy đủ khoảng 7 giây; kiểm tra độ mới khi cache còn mới thêm khoảng 1,1 giây (tổng 1,4 giây so với 0,3 giây khi dùng --cached); sửa một file thì rebuild khoảng 6,7 giây.
  - _Why:_ Chi phí đã đo thật cho rủi ro r-cost: chấp nhận được cho một truy vấn, nhưng nhân lên khi agent gọi nhiều lần; --cached là lối thoát, refresh gia tăng hoặc bộ nhớ đệm kết quả kiểm tra là hướng tối ưu cho task sau.

## Residual risks

- **r-cost** (medium) — Refresh đầy đủ trên repo rất lớn (payment-hub) có thể mất vài giây mỗi lần cache cũ; cần đo và, nếu chậm, cân nhắc refresh gia tăng có cache usedNames ở task sau.
- **r-readonly** (low) — Lệnh repo-map vốn chỉ đọc nay có thể ghi .harnix/cache (dữ liệu dẫn xuất, git-ignored); test chỉ-đọc và tài liệu phải nêu rõ, --cached là lối thoát.

## Evidence

- `chk-fresh` — pass (2026-11-12 14:55:36 +07:00): pnpm exec vitest run test/unit/core/repo-map/freshness.test.ts test/integration/commands/repo-map-freshness.test.ts test/integration/scenarios/repo-map-incremental.test.ts test/integration/scenario... — exit 0
- skipped (2026-11-12 14:58:11 +07:00): Task contract revised at persisted replan: Test tích hợp được chuyển sang test/integration/scenarios vì quy tắc test-structure buộc test trong commands phản chiếu 1-1 một file src/commands; check cũ trỏ tới đường dẫn không còn tồn tại.
- `chk-fresh-2` — pass (2026-11-12 15:01:25 +07:00): pnpm exec vitest run test/unit/core/repo-map/freshness.test.ts test/integration/scenarios/repo-map-freshness.test.ts test/integration/scenarios/repo-map-incremental.test.ts test/integration/scenari... — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-gates` — pass (2026-11-12 15:01:34 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-11-12 15:03:22 +07:00): pnpm test — exit 0
