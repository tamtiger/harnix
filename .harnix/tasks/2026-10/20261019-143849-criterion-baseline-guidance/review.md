# Thông báo rõ cho cổng baseline của --criterion --met

- **ID:** 20261019-143849-criterion-baseline-guidance
- **Mode:** lite
- **Epic:** 20261019-143847-field-defects-hardening
- **Status:** completed/finishing
- **Created:** 2026-10-19 14:38:47 +07:00
- **Updated:** 2026-10-19 15:31:04 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 5/5 met or waived |
| Required checks | 100% | 5/5 passed |
| Residual risks | 1 | risk-1: low |

## Goal

Giữ nguyên điều kiện met của --criterion nhưng khi bị từ chối thì thông báo nêu từng check, lý do (chưa chạy, fail, stale, baseline chưa có hiệu lực) và cách xử lý.

## Non-goals

- Không cho tiêu chí met mà thiếu bằng chứng xanh.

## Relevant paths

- `src/core/workflow/criterion.ts`
- `src/core/workflow/evidence.ts`
- `test/integration/scenarios/cli-errors.test.ts`
- `test/unit/core/workflow/criterion.test.ts`

## Acceptance criteria

- [x] `ac-1` (met): Khi workflow --criterion <id> --met bị từ chối, thông báo giữ nguyên cụm "has no fresh passing evidence from required check(s)" và thêm với từng check chưa đạt một lý do cụ thể: chưa có bằng chứng, lần chạy gần nhất không pass, hoặc digest stale.
- [x] `ac-2` (met): Với check đã khai báo baseline nhưng chưa có hiệu lực (thiếu một check required khác không baseline đang pass và phủ toàn bộ tiêu chí của nó), thông báo nói rõ baseline chưa có hiệu lực vì thiếu check chứng minh và chỉ dẫn thêm một check tập trung bằng --set-check phủ đủ tiêu chí rồi chạy nó; điều kiện cho phép met và cổng --finish không đổi, test hồi quy hiện có vẫn xanh.
- [x] `ac-3` (met): Toàn bộ test suite của dự án pass.
- [x] `ac-4` (met): pnpm run typecheck exit 0: sửa lỗi có sẵn từ v2.10.0 tại src/core/workflow/evidence.ts (checkId có thể undefined khi đồng bộ checklist plan.md).
- [x] `ac-5` (met): Khôi phục kiểm thử đầu-cuối cho việc che đường dẫn trong lỗi công khai: một lệnh CLI thật nhả lỗi có đường dẫn thì stderr và JSON chứa [PROJECT] và không chứa đường dẫn thật (thay phần đã yếu đi ở cli-errors.test.ts).

## Required checks

- [x] `chk-focus` (focused): Test criterion cho thông báo baseline và hồi quy — pass (2026-10-19 15:29:26 +07:00)
- [x] `check-suite` (full): Toàn bộ test suite của dự án pass — pass (2026-10-19 15:30:57 +07:00)
- [x] `chk-gates` (focused): Contract tests (test:gates) và bộ test của dự án phải xanh — pass (2026-10-19 15:29:31 +07:00)
- [x] `chk-typecheck` (focused): Typecheck toàn dự án phải exit 0 — pass (2026-10-19 15:29:37 +07:00)
- [x] `chk-redaction` (focused): Test kịch bản lỗi CLI che đường dẫn — pass (2026-10-19 15:29:42 +07:00)

## Decisions

- **dec-1** — Chỉ sửa thông báo của --criterion --met; không nới điều kiện met và không đổi authorizedRedBaseline.
  - _Why:_ authorizedRedBaseline đã đòi một check chứng minh đang pass phủ đủ tiêu chí; ca báo cáo là baseline chưa có hiệu lực, nên cần giải thích lý do chứ không cần đổi cổng.
- **dec-2** — Giữ nguyên chuỗi gốc "has no fresh passing evidence from required check(s)" làm tiền tố của thông báo.
  - _Why:_ Test hiện có (criterion.test.ts) và người dùng đang khớp theo cụm này; chỉ nối thêm lý do phía sau.
- **dec-3** — Gộp hai việc tồn đọng của task trước (typecheck lỗi sẵn, kiểm thử che đường dẫn đầu-cuối) vào task này theo chỉ định của người dùng.
  - _Why:_ Người dùng yêu cầu sửa vào task kế tiếp; cả hai nhỏ và độc lập với thông báo của --criterion.

## Residual risks

- **risk-1** (low) — Thông báo dài hơn có thể tràn dòng khi nhiều check; giới hạn lý do mỗi check bằng một câu ngắn.

## Evidence

- `chk-focus` — pass (2026-10-19 15:29:26 +07:00): pnpm exec vitest run test/unit/core/workflow/criterion.test.ts — exit 0
- `chk-gates` — pass (2026-10-19 15:29:31 +07:00): pnpm test:gates — exit 0
- `chk-typecheck` — pass (2026-10-19 15:29:37 +07:00): pnpm typecheck — exit 0
- `chk-redaction` — pass (2026-10-19 15:29:42 +07:00): pnpm exec vitest run test/integration/scenarios/cli-errors.test.ts — exit 0
- `check-suite` — pass (2026-10-19 15:30:57 +07:00): pnpm test — exit 0
