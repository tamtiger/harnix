# Giảm output dài của ready dry-run, finish và các gợi ý lặp

- **ID:** 20261006-202546-quiet-advisories
- **Mode:** full
- **Epic:** 20261006-202542-harnix-self-improvement
- **Status:** completed/finishing
- **Created:** 2026-10-06 20:25:42 +07:00
- **Updated:** 2026-10-07 11:37:50 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Các thông báo dài lặp lại ở mỗi lần gọi (advisory chưa baseline từng check trong ready dry-run, hint learning ở --finish) tốn token mà không đổi quyết định; gộp chúng thành một dòng ngắn có số lượng.

## Non-goals

- Không nới ngưỡng hay bỏ test cấu trúc
- Không đổi hành vi hiện có ngoài phạm vi tiêu chí

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-1` (met): transition --dry-run gộp mọi advisory chưa baseline thành một mục duy nhất nêu số check, vẫn giữ unbaselinedChecks; advisory glob không khớp file giữ nguyên.
- `ac-2` (met): learning.hint của --finish --brief rút còn một câu ngắn và chỉ xuất hiện khi captured bằng 0.
- `ac-3` (met): Có test đo độ dài output trước và sau cho một task mẫu để chặn hồi quy phình to.

## Required checks

- `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-07 11:37:25 +07:00)
- `check-advisories` (focused): Test advisory chưa baseline gộp một dòng, learning.hint ngắn và giới hạn độ dài output — pass (2026-10-07 11:36:32 +07:00)

## Evidence

- `check-advisories` — pass (2026-10-07 11:36:32 +07:00): pnpm exec vitest run test/unit/core/workflow/ready.test.ts test/unit/core/workflow/transition.test.ts test/unit/core/workflow/finish.test.ts — exit 0
- `check-suite` — pass (2026-10-07 11:37:25 +07:00): pnpm test — exit 0
