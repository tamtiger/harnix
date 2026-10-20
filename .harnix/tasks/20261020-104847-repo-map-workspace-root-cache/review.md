# repo-map --workspace dùng cache của workspace root và không tạo .harnix rác

- **ID:** 20261020-104847-repo-map-workspace-root-cache
- **Mode:** full
- **Epic:** 20261020-104845-workspace-and-gate-improvements
- **Status:** completed/finishing
- **Created:** 2026-10-20 10:48:45 +07:00
- **Updated:** 2026-10-20 11:31:57 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Khi sub-repo chưa có cache riêng nhưng workspace root đã có repo-map-v1.json (do repo-map --refresh ở root), truy vấn --workspace đọc từ cache root theo tiền tố thư mục thay vì báo missing; đồng thời refresh --workspace không tạo thư mục .harnix mới trong sub-repo chưa init.

## Non-goals

- Không đổi định dạng repo-map-v1.json.
- Không tự chạy harnix init.

## Relevant paths

- `docs/HARNIX_PRD.md`
- `src/commands/repo-map-internal.ts`
- `src/core/repo-map`
- `test/integration/commands/repo-map-workspace.test.ts`
- `test/unit/core/repo-map`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- [x] `ac-1` (met): repo-map --query <text> --workspace: member không có cache riêng nhưng workspace root có repo-map-v1.json được phục vụ từ cache root, lọc theo tiền tố thư mục của member; member báo status ready kèm source workspace, đường dẫn kết quả giữ dạng <member>/<path> không lặp tiền tố, và số records của member là số bản ghi thuộc tiền tố đó.
- [x] `ac-2` (met): Member không có cache nào (cả riêng lẫn ở root) hoặc cache root không chứa record nào dưới tiền tố member (ví dụ .gitignore của root loại member) vẫn báo missing kèm gợi ý chạy repo-map --refresh; cache hỏng vẫn báo invalid; member có cache riêng hợp lệ vẫn dùng cache riêng (source member).
- [x] `ac-3` (met): repo-map --refresh --workspace không tạo thư mục .harnix trong member chưa có .harnix/config.yaml: member đã init được refresh như cũ, member chưa init được phủ bởi cache của workspace root khi root đã init, và khi cả hai chưa init lệnh báo rõ cần harnix init và không ghi file nào.
- [x] `ac-4` (met): Toàn bộ test suite của dự án và test:gates pass.

## Required checks

- [x] `chk-focus` (focused): Test repo-map workspace: cache root, initialized, refresh — pass (2026-10-20 11:30:21 +07:00)
- [x] `chk-gates` (focused): Contract tests: docs, skills, instruction budget, golden — pass (2026-10-20 11:30:25 +07:00)
- [x] `check-suite` (full): Toàn bộ test suite của dự án pass — pass (2026-10-20 11:31:30 +07:00)

## Decisions

- **dec-1** — refresh --workspace không bao giờ tạo .harnix trong thư mục chưa có .harnix/config.yaml (phương án A, chờ người dùng xác nhận ở bước duyệt).
  - _Why:_ Hiện refreshWorkspaceRepoMap ghi .harnix/cache vào mọi member, tạo thư mục untracked trong các sub-repo chưa init. Phương án B (giữ ghi từng member) giữ hành vi cũ nhưng để lại rác.
- **dec-user-1** — Chọn cách A: refresh --workspace refresh cache root một lần để phủ member chưa init, không tạo .harnix trong member.
  - _Why:_ Người dùng đã chọn cách A; tránh ghi file rác vào sub-repo.
- **dec-ver** — Phiên bản 2.13.0-dev.2, kind fixed. Thêm trường initialized (có .harnix/config.yaml) cho member, giữ hasHarnix cũ cho discovery; logic lọc cache root và refresh đặt ở file mới src/core/repo-map/workspace-root-cache.ts; refresh --workspace ghi cache root (đã quyết định cách A).
  - _Why:_ Review: workspace.ts gần chạm 300 dòng, event-matrix dùng chung discovery, repo-map-internal.test.ts đã 389 dòng.

## Evidence

- `chk-focus` — pass (2026-10-20 11:30:21 +07:00): pnpm exec vitest run test/unit/core/repo-map test/integration/commands/repo-map-internal.test.ts test/integration/commands/repo-map-workspace.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-gates` — pass (2026-10-20 11:30:25 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-20 11:31:30 +07:00): pnpm test — exit 0
