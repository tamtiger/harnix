# Chuẩn hóa EOL khi băm inputDigest và giữ tương thích digest cũ

- **ID:** 20261019-143852-input-digest-eol-normalization
- **Mode:** full
- **Epic:** 20261019-143847-field-defects-hardening
- **Status:** completed/finishing
- **Created:** 2026-10-19 14:38:47 +07:00
- **Updated:** 2026-10-19 15:55:07 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 5/5 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Băm file văn bản sau khi đổi CRLF thành LF để autocrlf và git stash không làm digest lệch, đồng thời vẫn nhận evidence ghi theo công thức byte thô để không check nào bị stale.

## Non-goals

- Không đổi cách băm file nhị phân.
- Không lưu thêm file snapshot.

## Relevant paths

- `src/core/tasks/task-validate-contracts.ts`
- `src/core/verification/input-digest.ts`
- `src/core/verification/line-endings.ts`
- `src/core/workflow/init-task.ts`
- `src/core/workflow/snapshot.ts`
- `test/unit/core/tasks/task-validate-contracts.test.ts`
- `test/unit/core/verification/input-digest-eol.test.ts`
- `test/unit/core/verification/line-endings.test.ts`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- [x] `ac-1` (met): Có test hồi quy chứng minh digest phụ thuộc kết thúc dòng: hai file chỉ khác LF và CRLF cho cùng inputDigest mới nhưng khác rawInputDigest (công thức byte thô trước đây); việc git stash pop gây ra CRLF chưa được tái hiện, chỉ ghi nhận là giả thuyết.
- [x] `ac-2` (met): inputDigest băm file văn bản (không chứa byte NUL) sau khi đổi CRLF thành LF, giữ nguyên byte của file nhị phân và CR đơn; repo chỉ có file LF không đổi digest nào.
- [x] `ac-3` (met): Evidence ghi theo công thức byte thô (rawInputDigest) hoặc theo digest: 3 (legacyInputDigest) vẫn fresh khi nội dung không đổi; evidence mới ghi inputDigest chuẩn hóa vẫn fresh khi file chuyển giữa LF và CRLF.
- [x] `ac-4` (met): Toàn bộ test suite của dự án và golden pass.
- [x] `ac-5` (met): Chuẩn hóa kết thúc dòng LF (và thay byte NUL trong regex bằng ký tự escape NUL) cho các file Git đang coi là binary: input-digest.ts, init-task.ts, task-validate-contracts.test.ts, làm thành bước định dạng riêng tách khỏi thay đổi logic.

## Required checks

- [x] `chk-focus` (focused): Test input-digest cho EOL, nhị phân và tương thích digest cũ — pass (2026-10-19 15:53:46 +07:00)
- [x] `check-suite` (full): Toàn bộ test suite của dự án pass — pass (2026-10-19 15:54:59 +07:00)
- [x] `chk-gates` (focused): Contract tests (test:gates) và bộ test của dự án phải xanh — pass (2026-10-19 15:53:51 +07:00)

## Decisions

- **dec-1** — Mỗi file được băm theo hai cách (byte thô và EOL chuẩn hóa); digest ghi mới dùng công thức chuẩn hóa, digest cũ (byte thô và digest: 3) vẫn được chấp nhận.
  - _Why:_ Giữ evidence cũ fresh, không ai phải chạy lại check; file đọc một lần, chi phí chủ yếu là băm thêm.
- **dec-2** — Bước định dạng ba file Git coi là nhị phân được làm khi task còn planning, trước ready; nó không đổi hành vi (615 test liên quan xanh trước và sau).
  - _Why:_ Cần file đọc được dưới dạng văn bản để sửa input-digest.ts an toàn; tách khỏi thay đổi logic để diff dễ xem.
- **dec-3** — Giữ digest: 4 và chỉ đổi dữ liệu entry sang bản đã chuẩn hóa EOL; thêm rawInputDigest và nhận cả ba digest trong digestMatches.
  - _Why:_ Repo chỉ có file LF không đổi digest nào; evidence cũ (byte thô, digest: 3) vẫn fresh; không thêm số phiên bản công thức mới.

## Evidence

- `chk-focus` — pass (2026-10-19 15:53:46 +07:00): pnpm exec vitest run test/unit/core/verification test/unit/core/tasks test/unit/core/workflow — exit 0
- `chk-gates` — pass (2026-10-19 15:53:51 +07:00): pnpm test:gates — exit 0
- `check-suite` — pass (2026-10-19 15:54:59 +07:00): pnpm test — exit 0
