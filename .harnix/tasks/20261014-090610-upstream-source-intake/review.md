# Ghi nhận nguồn addyosmani/agent-skills và mattpocock/skills

- **ID:** 20261014-090610-upstream-source-intake
- **Mode:** lite
- **Epic:** 20261014-090610-harnix-skill-upstream-adoption
- **Status:** completed/finishing
- **Created:** 2026-10-14 09:06:10 +07:00
- **Updated:** 2026-10-14 11:42:35 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 5/5 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Ghi provenance, giấy phép MIT và mapping reuse/adapt/remove cho hai repo nguồn vào NOTICE, docs/UPSTREAM_BASELINE.md và docs/UPSTREAM_MAPPING.md.

## Non-goals

- Không đổi hành vi runtime

## Relevant paths

- `NOTICE`
- `docs/UPSTREAM_BASELINE.md`
- `docs/UPSTREAM_MAPPING.md`
- `CHANGELOG.md`
- `package.json`

## Relevant specs

- `docs/UPSTREAM_MAPPING.md`

## Acceptance criteria

- [x] `ac-1` (met): NOTICE liệt kê hai upstream MIT cùng giấy phép
- [x] `ac-2` (met): UPSTREAM_BASELINE ghi SHA, giấy phép, ngày truy cập của hai repo
- [x] `ac-3` (met): UPSTREAM_MAPPING có mapping từng ý được dùng lại, thích nghi hoặc loại bỏ kèm lý do
- [x] `ac-4` (met): Các gate tài liệu (test:gates) và test đạt exit code 0 mới
- [x] `ac-5` (met): Chạy version:sync 2.5.0-dev.1 ghi nhận thay đổi release-visible vào CHANGELOG.md

## Required checks

- [x] `check-gates` (focused): Contract tests (cấu trúc skill, ngân sách token, guide) — pass (2026-10-14 11:38:57 +07:00)
- [x] `check-suite` (full): Toàn bộ bộ test của dự án — pass (2026-10-14 11:41:36 +07:00)

## Decisions

- **dec-1** — Bổ sung version:sync 2.5.0-dev.1 và mở rộng check inputs
  - _Why:_ Tránh lỗi fatal --fold-dev ở Task 2 khi thiếu dev entry và bảo đảm digest hash phản ánh đúng các file tài liệu thay đổi
- **dec-2** — Ghi nhận đầy đủ commit SHA aeac41d4 và 49dd158d, 3 mẫu hình bổ sung (Chesterton's Fence, Forced Mutation, Smell Baseline) và 7 mẫu hình rejected trong UPSTREAM_MAPPING
  - _Why:_ Bảo đảm mapping bao quát toàn bộ 64 kỹ năng của 2 upstream và phân định rõ ranh giới kiến trúc Harnix

## Evidence

- `check-gates` — pass (2026-10-14 11:38:57 +07:00): pnpm test:gates — exit 0
- `check-suite` — pass (2026-10-14 11:41:36 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
