# Bỏ qua ngôn ngữ weak khi đã có ngôn ngữ xác nhận

- **ID:** 20261020-212647-detect-weak-language-noise
- **Mode:** lite
- **Status:** cancelled/cancelling
- **Created:** 2026-10-20 21:26:47 +07:00
- **Updated:** 2026-10-20 21:33:03 +07:00

**Verdict:** CANCELLED — Đổi tên file test để khớp quy tắc mirror của test-structure; check đã pass bất biến nên tạo lại task

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 0% | 0/1 met or waived |
| Required checks | 50% | 1/2 passed |

## Goal

Detect không gán ngôn ngữ chỉ từ file lẻ (weak) khi project đã có ngôn ngữ probable/confirmed

## Acceptance criteria

- [ ] `ac-1` (pending): Repo có tsconfig.json cùng một file .py và .mjs lẻ chỉ phát hiện typescript; repo chỉ có file weak vẫn nhận ngôn ngữ đó

## Required checks

- [ ] `check-1` (full): Suite dự án — fail (2026-10-20 21:32:20 +07:00)
- [x] `check-focus` (focused): Test detect weak — pass (2026-10-20 21:30:08 +07:00)

## Cancellation

- **Reason:** Đổi tên file test để khớp quy tắc mirror của test-structure; check đã pass bất biến nên tạo lại task

## Evidence

- `check-focus` — pass (2026-10-20 21:30:08 +07:00): pnpm exec vitest run test/unit/core/stack/detection-weak.test.ts — exit 0
- `check-1` — fail (2026-10-20 21:32:20 +07:00): pnpm test — exit 1
