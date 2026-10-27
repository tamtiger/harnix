# Tên lệnh trần không tìm thấy trên PATH không còn đi qua cmd.exe

- **ID:** 20261020-135202-check-runner-unresolved-bare-name
- **Mode:** full
- **Epic:** 20261020-135200-harness-hardening-followups
- **Status:** completed/finishing
- **Created:** 2026-10-20 13:52:00 +07:00
- **Updated:** 2026-10-20 15:02:07 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Đóng khe còn lại của check-runner trên Windows: tên lệnh trần mà PATH không resolve được không còn được giao cho cmd.exe (nơi tìm trong thư mục làm việc trước), trừ một danh sách cố định lệnh nội trang.

## Non-goals

- Không đổi hành vi ngoài win32.
- Không đổi đường chạy .exe và shim đã resolve.

## Relevant paths

- `src/utils/check-runner.ts`
- `test/unit/utils/check-runner.test.ts`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- [x] `ac-1` (met): Trên win32, tên lệnh trần mà lookup không tìm thấy và không thuộc danh sách nội trang bị ném lỗi nêu tên lệnh và gợi ý dùng đường dẫn đầy đủ; không bao giờ trả cmd.exe cho tên đó; một tên.cmd đặt trong thư mục làm việc không được chạy.
- [x] `ac-2` (met): Lệnh nội trang echo, dir, type, ver, set vẫn chạy qua cmd.exe; shim .cmd/.bat đã resolve, .exe/.com trực tiếp và mọi nền tảng ngoài win32 giữ nguyên hành vi.
- [x] `ac-3` (met): Toàn bộ test suite, lint, typecheck và test:gates pass; changelog ghi rõ thay đổi.

## Required checks

- [x] `chk-focus` (focused): Test resolveInvocation cho tên trần không resolve được — pass (2026-10-20 15:00:08 +07:00)
- [x] `chk-gates` (focused): Contract tests: docs, skills, instruction budget, golden — pass (2026-10-20 15:00:13 +07:00)
- [x] `check-suite` (full): Toàn bộ test suite của dự án pass — pass (2026-10-20 15:01:39 +07:00)

## Decisions

- **dec-1** — Danh sách lệnh nội trang cố định là dir, echo, set, type, ver.
  - _Why:_ Chỉ các lệnh này không có file thực thi trên PATH; mọi tên khác phải resolve được.

## Evidence

- `chk-focus` — pass (2026-10-20 15:00:08 +07:00): pnpm exec vitest run test/unit/utils/check-runner.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-gates` — pass (2026-10-20 15:00:13 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-20 15:01:39 +07:00): pnpm test — exit 0
