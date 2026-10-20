# Công thái học cờ workflow: thông báo thiếu id và --task cho --transition --dry-run

- **ID:** 20261020-135204-workflow-cli-ergonomics
- **Mode:** lite
- **Epic:** 20261020-135200-harness-hardening-followups
- **Status:** completed/finishing
- **Created:** 2026-10-20 13:52:00 +07:00
- **Updated:** 2026-10-20 15:23:24 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Hai điểm vướng khi dùng hidden workflow: (a) --add-decision, --add-risk hay --add-criterion thiếu id trả thông báo gây hiểu nhầm ('does not accept operands' hay 'requires --text and --rationale') thay vì nói cần id; (b) không kiểm được ready-gate của task member đang planning trong epic vì --transition --dry-run chưa nhận --task.

## Non-goals

- Không đổi cờ hiện có, không đổi schema, không cho --task thay đổi state.

## Relevant paths

- `docs/HARNIX_WORKFLOW.md`
- `src/commands/workflow-command.ts`
- `src/commands/workflow-flag-owners.ts`
- `src/commands/workflow-flags.ts`
- `src/commands/workflow-handlers.ts`
- `src/templates/harnix/workflow.md`

## Acceptance criteria

- [x] `ac-1` (met): Gọi --add-decision, --add-risk hay --add-criterion thiếu id (hay đặt giá trị cờ ở vị trí id) trả lỗi nêu đúng dạng dùng: --add-decision <id> --text <text> --rationale <why>, không còn thông báo 'does not accept operands' gây hiểu nhầm.
- [x] `ac-2` (met): workflow --transition ready/ready --dry-run --task <id> trả kết quả dry-run read-only cho task member đang planning mà không đổi con trỏ active hay state; --transition không dry-run kèm --task vẫn bị từ chối.
- [x] `ac-3` (met): Toàn bộ test suite, lint, typecheck và test:gates pass; HARNIX_WORKFLOW.md và template workflow.md mô tả cờ (selfhost:sync).

## Required checks

- [x] `chk-focus` (focused): Test cờ workflow: thông báo id và --task dry-run — pass (2026-10-20 15:20:58 +07:00)
- [x] `chk-gates` (focused): Contract tests: docs, skills, instruction budget, golden — pass (2026-10-20 15:21:04 +07:00)
- [x] `check-suite` (full): Toàn bộ test suite của dự án pass — pass (2026-10-20 15:22:55 +07:00)

## Decisions

- **dec-1** — Phiên bản 2.14.0-dev.4, kind changed. Chỉ --transition kèm --dry-run mới nhận --task; golden snapshot chỉ cập nhật đúng chuỗi mới.
  - _Why:_ Dry-run không ghi state nên không phá quy tắc 'state changes act only on the active task'.
- **dec-2** — legacy-history.test.ts sao chép toàn bộ task record và epic của repo nên chậm dần theo dữ liệu; tăng timeout của describe và của test epic lên 90 giây thay vì để flake khi suite chạy song song.
  - _Why:_ Test phụ thuộc kích thước dữ liệu thật của repo: mỗi epic mới làm nó chậm hơn; độ trễ do tải máy, không phải lỗi logic.

## Evidence

- skipped (2026-10-20 15:11:45 +07:00): Task contract revised at persisted replan: Đường dẫn test thực tế nằm ở test/integration/commands và test/unit/core/workflow, không phải test/unit/commands như dự kiến ban đầu.
- `chk-focus` — pass (2026-10-20 15:20:58 +07:00): pnpm exec vitest run test/integration/commands/workflow-handlers.test.ts test/integration/commands/workflow-flags.test.ts test/unit/core/workflow/target-task.test.ts test/workflow/cli-contract.test... — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-gates` — pass (2026-10-20 15:21:04 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-20 15:22:55 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
