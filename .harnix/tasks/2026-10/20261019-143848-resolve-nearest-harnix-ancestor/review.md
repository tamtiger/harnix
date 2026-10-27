# Dò gốc dự án theo .harnix gần nhất và báo lỗi rõ khi thiếu

- **ID:** 20261019-143848-resolve-nearest-harnix-ancestor
- **Mode:** full
- **Epic:** 20261019-143847-field-defects-hardening
- **Status:** completed/finishing
- **Created:** 2026-10-19 14:38:47 +07:00
- **Updated:** 2026-10-19 15:26:02 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 5/5 met or waived |
| Required checks | 100% | 3/3 passed |
| Residual risks | 1 | risk-1: medium |

## Goal

Thay việc dừng ở git root bằng việc tìm ancestor gần nhất có .harnix/config.yaml hợp lệ; khi không có thì báo lỗi rõ ràng thay vì ENOENT realpath với đường dẫn bị che.

## Non-goals

- Không cho target lấy từ nội dung repository, log hay output công cụ.
- Không tự tạo .harnix hay chạy harnix init.

## Relevant paths

- `src/cli-workflow-commands.ts`
- `src/commands/status.ts`
- `src/commands/workflow-command.ts`
- `src/utils/project-discovery.ts`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- [x] `ac-1` (met): Các lệnh workflow (--preflight, --save, --init, --inspect...), mem và skill dùng findInitializedProject nên chạy trong repo git con vẫn tìm đúng .harnix/config.yaml của ancestor gần nhất, giống status, pause, resume.
- [x] `ac-2` (met): Khi không có ancestor hợp lệ, các lệnh đó trả lỗi rõ ràng (không tìm thấy .harnix kèm hướng dẫn chạy từ thư mục đúng), không còn ENOENT realpath với placeholder [PROJECT].
- [x] `ac-3` (met): Target tường minh vẫn được canonicalize và từ chối traversal, unsafe root, symlink hoặc junction escape; init, update và uninstall giữ nguyên hành vi theo git root.
- [x] `ac-4` (met): Toàn bộ test suite của dự án và test:gates pass.
- [x] `ac-5` (met): Khi không có ancestor hợp lệ, lỗi liệt kê các thư mục con cấp 1 có .harnix/config.yaml (chỉ đọc, không tự chọn target) và nhắc chạy lại từ một trong số đó.

## Required checks

- [x] `chk-focus` (focused): Test đơn vị và tích hợp cho dò gốc theo .harnix gần nhất và lỗi khi thiếu — pass (2026-10-19 15:20:29 +07:00)
- [x] `check-suite` (full): Toàn bộ test suite của dự án pass — pass (2026-10-19 15:18:54 +07:00)
- [x] `chk-gates` (focused): Contract tests (test:gates) và bộ test của dự án phải xanh — pass (2026-10-19 15:20:34 +07:00)

## Decisions

- **dec-1** — Không sửa resolveProjectRoot; chuyển lệnh workflow và verify-plan sang findInitializedProject, giữ resolveProjectRoot cho init, update, uninstall.
  - _Why:_ findInitializedProject đã dò lên ancestor và đang được status, pause, resume dùng; sửa resolveProjectRoot sẽ làm init trong repo con trỏ nhầm .harnix của thư mục cha.
- **dec-2** — Chuỗi [PROJECT] chỉ là cwd bị che bởi redactPublicErrorMessage, không phải lỗi riêng; lỗi thật là root dừng ở git root.
  - _Why:_ Đã đối chiếu cli-helpers.ts:131 và workflow-command.ts:127.
- **dec-3** — Phạm vi chuyển sang findInitializedProject chỉ gồm workflow, mem và skill; verify-plan, init, update, uninstall, doctor giữ resolveProjectRoot. Quyết định này thay thế phần verify-plan trong dec-1.
  - _Why:_ verify-plan đọc manifest của thư mục đang đứng để sinh lệnh test, không đọc .harnix, nên chuyển sang ancestor sẽ phân tích nhầm repo cha; doctor và update ghi state nên giữ hành vi git root.
- **dec-4** — Không sửa docs/HARNIX_WORKFLOW.md, workflow.md và không chạy selfhost:sync trong task này.
  - _Why:_ Tài liệu và AGENTS.md đã nêu quy tắc nearest ancestor; mã nay khớp quy tắc nên không có câu nào mâu thuẫn cần sửa, và không đổi template.
- **dec-5** — Tách test che đường dẫn trong cli-errors.test.ts thành hai test: lỗi thiếu project của mem và việc che cwd khỏi lỗi ENOENT thô.
  - _Why:_ Test cũ dựa vào việc mem ngoài project nhả lỗi ENOENT có đường dẫn; hành vi đó chính là lỗi được sửa. Cam kết không lộ đường dẫn vẫn được kiểm bằng cả hai test.

## Residual risks

- **risk-1** (medium) — pnpm run typecheck đang lỗi sẵn trên HEAD tại src/core/workflow/evidence.ts:27 (checkId có thể undefined, từ v2.10.0), và pnpm run lint lỗi sẵn ở các file ngoài phạm vi; hai lệnh này không xanh độc lập với task này.

## Evidence

- `chk-focus` — pass (2026-10-19 15:20:29 +07:00): pnpm exec vitest run test/unit/utils/project-discovery.test.ts test/integration/commands/workflow-command.test.ts test/integration/commands/status.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-gates` — pass (2026-10-19 15:20:34 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-19 15:18:54 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
