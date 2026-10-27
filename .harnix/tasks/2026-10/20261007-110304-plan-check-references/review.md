# Cổng ready cảnh báo plan.md nhắc id check không khai báo

- **ID:** 20261007-110304-plan-check-references
- **Mode:** full
- **Epic:** 20261006-202542-harnix-self-improvement
- **Status:** completed/finishing
- **Created:** 2026-10-07 11:03:04 +07:00
- **Updated:** 2026-10-07 13:44:41 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Khi plan.md còn nhắc id check đã đổi tên hoặc mới thêm (ví dụ check-2b) mà validationPlan không có, dry-run của cổng ready nêu rõ để plan và task không lệch nhau.

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-1` (met): --transition ready/ready --dry-run trả advisory liệt kê id check dạng check-... xuất hiện trong plan.md nhưng không có trong validationPlan; đây chỉ là advisory, không chặn ready.
- `ac-2` (met): Chỉ xét id nằm trong backtick hoặc đầu dòng checklist, bỏ qua code fence và văn bản thường; không báo sai khi plan nhắc từ khác; có test cho cả hai nhánh.
- `ac-3` (met): Advisory gộp thành một dòng có số lượng và danh sách id ngắn, cùng kiểu với advisory gọn của task quiet-advisories.

## Required checks

- `check-1` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-07 13:44:16 +07:00)
- `check-refs` (focused): Test advisory plan.md nhắc id check không khai báo (lõi và dry-run) — pass (2026-10-07 13:43:17 +07:00)

## Decisions

- **d-check-prefix** — Advisory id check lạ trong plan.md chỉ xét tiền tố check- trong backtick hoặc đầu mục checklist; check đặt tên khác như chk-1 không được cảnh báo.
  - _Why:_ Quét mọi từ trong backtick sẽ báo sai trên tên file và lệnh; tiền tố check- là quy ước đặt tên check của Harnix.

## Evidence

- `check-refs` — pass (2026-10-07 13:43:17 +07:00): pnpm exec vitest run test/unit/core/workflow/ready-content.test.ts test/unit/core/workflow/ready.test.ts — exit 0
- `check-1` — pass (2026-10-07 13:44:16 +07:00): pnpm test — exit 0
