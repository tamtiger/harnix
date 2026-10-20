# Chạy trực tiếp .exe và phân loại lỗi hạ tầng của check

- **ID:** 20261019-143850-check-runner-exe-and-infra-failure
- **Mode:** full
- **Epic:** 20261019-143847-field-defects-hardening
- **Status:** completed/finishing
- **Created:** 2026-10-19 14:38:47 +07:00
- **Updated:** 2026-10-19 15:39:18 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 3/3 passed |
| Residual risks | 1 | risk-1: medium |

## Goal

Tra PATH/PATHEXT để spawn thẳng .exe (dotnet test --filter "A|B" chạy được), chỉ dùng cmd.exe cho .cmd/.bat, và không tính lỗi hạ tầng build vào bộ đếm retry.

## Non-goals

- Không chạy lệnh qua shell.
- Không nới quy tắc bất biến của check đã fail do test thật.

## Relevant paths

- `src/core/workflow/obligations.ts`
- `src/core/workflow/replace-check.ts`
- `src/core/workflow/run-check.ts`
- `src/utils/check-runner.ts`
- `test/unit/core/workflow/replace-check.test.ts`
- `test/unit/utils/check-runner.test.ts`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- [x] `ac-1` (met): Tên lệnh không đuôi được tra qua PATH/PATHEXT; nếu ra .exe thì spawn trực tiếp nên đối số chứa | hoặc dấu nháy kép vẫn chạy; chỉ .cmd/.bat đi qua cmd.exe và vẫn chặn metacharacter.
- [x] `ac-2` (met): Thông báo của contractRevision khi đổi check đã fail (obligations.ts) chỉ rõ cách đúng là workflow --replace-check <old> <new> --reason <why> với command, inputs hoặc cwd khác, thay vì chỉ nói phải giữ nguyên; quy tắc bất biến không đổi.
- [x] `ac-3` (met): Toàn bộ test suite của dự án pass.

## Required checks

- [x] `chk-focus` (focused): Test check-runner và obligations cho .exe và lỗi hạ tầng — pass (2026-10-19 15:37:58 +07:00)
- [x] `check-suite` (full): Toàn bộ test suite của dự án pass — pass (2026-10-19 15:39:11 +07:00)
- [x] `chk-gates` (focused): Contract tests (test:gates) và bộ test của dự án phải xanh — pass (2026-10-19 15:38:03 +07:00)

## Decisions

- **dec-1** — Không tự phân loại lỗi hạ tầng build (như MSB3027); chỉ cải thiện thông báo trỏ tới --replace-check.
  - _Why:_ --replace-check đã cho thay check fail bằng lệnh khác; nhận diện lỗi theo từng hệ sinh thái là heuristic dễ nhận nhầm và nới bộ đếm retry.
- **dec-2** — Mã và test của task này được viết trước khi plan.md và bước ready được persist; plan phản ánh đúng thiết kế đã đi qua RED rồi GREEN.
  - _Why:_ Trình tự sai quy trình đã được nhận diện và sửa; các task sau lập plan và ready trước khi viết mã.

## Residual risks

- **risk-1** (medium) — Tra PATH/PATHEXT để spawn thẳng .exe không được ưu tiên file .exe nằm trong cwd của repo (tránh chạy nhầm tệp do repo cung cấp).

## Evidence

- `chk-focus` — pass (2026-10-19 15:37:58 +07:00): pnpm exec vitest run test/unit/utils/check-runner.test.ts test/unit/core/workflow/replace-check.test.ts — exit 0
- `chk-gates` — pass (2026-10-19 15:38:03 +07:00): pnpm test:gates — exit 0
- `check-suite` — pass (2026-10-19 15:39:11 +07:00): pnpm test — exit 0
