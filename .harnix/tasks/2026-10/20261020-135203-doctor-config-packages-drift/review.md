# doctor báo cấu hình packages trong config.yaml lệch so với phát hiện hiện tại

- **ID:** 20261020-135203-doctor-config-packages-drift
- **Mode:** full
- **Epic:** 20261020-135200-harness-hardening-followups
- **Status:** completed/finishing
- **Created:** 2026-10-20 13:52:00 +07:00
- **Updated:** 2026-10-20 15:06:54 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Cho người đã init từ trước thấy khi packages trong config.yaml thiếu so với thư mục package phát hiện được hiện tại: doctor thêm finding mức info, không ghi config và không đổi mã thoát.

## Non-goals

- Không tự ghi lại config.yaml.
- Không đổi harnix update.
- Không đổi mã thoát hay schema doctor v2.

## Relevant paths

- `README.md`
- `docs/HARNIX_PRD.md`
- `src/core/doctor/config-drift.ts`
- `src/core/doctor/project.ts`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- [x] `ac-1` (met): Khi phát hiện hiện tại tìm thấy thư mục package không có trong packages của config.yaml, doctor thêm một finding config-packages-drift mức info kèm tối đa 10 đường dẫn tương đối POSIX đã sắp xếp và hướng xử lý; đủ package hay không có package thì không có finding.
- [x] `ac-2` (met): Finding info không đổi ok, summary.errors hay summary.warnings hay mã thoát; lỗi phát hiện bị bỏ qua êm; doctor vẫn chỉ đọc và không ghi config.
- [x] `ac-3` (met): Toàn bộ test suite, lint, typecheck và test:gates pass; README và PRD mô tả finding.

## Required checks

- [x] `chk-focus` (focused): Test doctor config packages drift — pass (2026-10-20 15:05:12 +07:00)
- [x] `chk-gates` (focused): Contract tests: docs, skills, instruction budget, golden — pass (2026-10-20 15:05:17 +07:00)
- [x] `check-suite` (full): Toàn bộ test suite của dự án pass — pass (2026-10-20 15:06:35 +07:00)

## Decisions

- **dec-1** — Finding có mức info để không đổi mã thoát mặc định của doctor.
  - _Why:_ Mức warning sẽ làm doctor thoát 1 với mọi người dùng đã init từ trước, thay đổi hành vi đã đóng băng.

## Evidence

- `chk-focus` — pass (2026-10-20 15:05:12 +07:00): pnpm exec vitest run test/unit/core/doctor — exit 0
- `chk-gates` — pass (2026-10-20 15:05:17 +07:00): pnpm test:gates — exit 0
- `check-suite` — pass (2026-10-20 15:06:35 +07:00): pnpm test — exit 0
