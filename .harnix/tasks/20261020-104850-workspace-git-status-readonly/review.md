# Thêm harnix status --workspace: bảng trạng thái Git chỉ đọc của các sub-repo

- **ID:** 20261020-104850-workspace-git-status-readonly
- **Mode:** full
- **Epic:** 20261020-104845-workspace-and-gate-improvements
- **Status:** completed/finishing
- **Created:** 2026-10-20 10:48:45 +07:00
- **Updated:** 2026-10-20 11:48:43 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Cho phép harnix status --workspace [path] liệt kê các sub-repo có .git với nhánh hiện tại, tình trạng thay đổi và số commit ahead/behind so với upstream đã biết cục bộ, chỉ đọc và không dùng mạng, để người dùng đa repo khỏi chạy git thủ công nhiều lần.

## Non-goals

- Không thêm pull, sync, fetch, checkout hay bất kỳ thao tác ghi Git nào.
- Không gọi mạng: ahead và behind chỉ tính theo ref upstream đã có sẵn trong repo.
- Không thêm lệnh công khai mới ngoài cờ của status.

## Relevant paths

- `README.md`
- `docs/HARNIX_PRD.md`
- `src/commands/repo-map-internal.ts`
- `src/commands/status.ts`
- `src/core/workspace`
- `test/integration/commands/status-workspace.test.ts`
- `test/workflow/cli-contract.test.ts`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- [x] `ac-1` (met): harnix status --workspace [path] trả một JSON có scope workspace và danh sách member (thư mục có .git, trực tiếp hoặc lồng hai cấp như discoverWorkspaceMembers) với name, branch (hoặc detached), dirty (số file thay đổi), upstream, ahead và behind; sắp xếp xác định theo tên.
- [x] `ac-2` (met): Chỉ đọc và an toàn: mỗi member chạy một lệnh git status --porcelain=v2 --branch -z với --no-optional-locks (và rev-parse nếu cần) bằng mảng đối số không qua shell, có -- khi truyền đường dẫn; không fetch, không đổi HEAD hay index; có timeout từng lệnh, đồng thời bị giới hạn, lỗi một member không làm hỏng bảng, đầu ra không có đường dẫn tuyệt đối.
- [x] `ac-3` (met): Cờ nằm trong test hợp đồng CLI, README và PRD; chạy ngoài workspace hoặc không có sub-repo trả danh sách rỗng có thông báo rõ; không có bất kỳ đường nào gọi lệnh ghi Git (có test chặn).
- [x] `ac-4` (met): Toàn bộ test suite của dự án và test:gates pass.

## Required checks

- [x] `chk-focus` (focused): Test status --workspace chỉ đọc — pass (2026-10-20 11:45:38 +07:00)
- [x] `chk-gates` (focused): Contract tests: docs, skills, instruction budget, golden — pass (2026-10-20 11:45:44 +07:00)
- [x] `check-suite` (full): Toàn bộ test suite của dự án pass — pass (2026-10-20 11:46:58 +07:00)

## Decisions

- **dec-1** — Đề xuất repo status và repo pull của báo cáo không nhận nguyên: chỉ làm phần đọc, và đặt thành cờ --workspace của status thay vì lệnh public mới.
  - _Why:_ AGENTS.md cấm tích hợp Git tự động và mọi thao tác ghi Git; pull/sync/fetch chạm mạng và đổi working tree. Phần bảng trạng thái chỉ đọc nằm trong ranh giới (Harnix đã có git context chỉ đọc ở status và preflight) và dùng lại discoverWorkspaceMembers.
- **dec-2** — Chờ người dùng xác nhận chọn cờ của status hay một lệnh riêng; mặc định là cờ.
  - _Why:_ Một lệnh public mới làm đổi con số mười bảy lệnh public và hợp đồng CLI; cờ thêm vào lệnh hiện có ít xâm lấn hơn.
- **dec-user-1** — Chọn cờ status --workspace thay vì lệnh public mới; pull và sync bị loại.
  - _Why:_ Giữ nguyên số lệnh public và ranh giới không tự động Git.
- **dec-ver** — Phiên bản 2.13.0 với --fold-dev, kind added; bản đồ dev: 46=dev.1, 47=dev.2, 48=dev.3, 49=dev.4. Dùng git status --porcelain=v2 --branch -z --no-optional-locks mỗi member; trích resolveWorkspaceRoot sang src/core/workspace để core không import commands; nhánh --workspace chạy trước --summary và --explain, kết hợp với --explain, --summary hay --limit bị từ chối exit 2.
  - _Why:_ Review: rev-parse tách lệnh dễ sai ở unborn branch và rename; status có thể ghi lại index nếu không tắt optional locks.

## Evidence

- `chk-focus` — pass (2026-10-20 11:45:38 +07:00): pnpm exec vitest run test/unit/core/workspace test/integration/scenarios/status-workspace.test.ts test/unit/commands/status.test.ts test/workflow/cli-contract.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-gates` — pass (2026-10-20 11:45:44 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-20 11:46:58 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
