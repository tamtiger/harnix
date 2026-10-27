# Củng cố status --workspace và các cổng: test ahead/behind git thật, measure:footprint báo thiếu dist, thông điệp test-structure

- **ID:** 20261020-135205-workspace-status-and-gate-hardening
- **Mode:** lite
- **Epic:** 20261020-135200-harness-hardening-followups
- **Status:** completed/finishing
- **Created:** 2026-10-20 13:52:00 +07:00
- **Updated:** 2026-10-20 15:28:52 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Ba điểm cứng hóa nhỏ rút ra từ epic trước: test git thật cho ahead/behind của status --workspace (hiện chỉ phủ bằng parser), measure:footprint báo lỗi rõ khi thiếu dist/cli.js thay vì lỗi khó hiểu, và test-structure nêu quy tắc đặt file khi phát hiện file mồ côi.

## Non-goals

- Không đổi hành vi runtime của Harnix.
- Không đổi hợp đồng quy tắc test-structure, chỉ đổi thông điệp.

## Relevant paths

- `scripts/measure-footprint.mjs`
- `test/integration/scenarios/status-workspace.test.ts`
- `test/unit/test-structure.test.ts`
- `test/workflow/measure-footprint-guard.test.ts`

## Acceptance criteria

- [x] `ac-1` (met): Scenario git thật cho status --workspace phủ ahead và behind: repo clone từ remote cục bộ commit thêm để có ahead 1, remote commit rồi fetch để có behind 1; chỉ dùng đường dẫn cục bộ, không network, có timeout riêng đủ dài.
- [x] `ac-2` (met): measure:footprint thoát khác 0 với thông điệp rõ (cần pnpm build trước) khi thiếu dist/cli.js, và vẫn chạy bình thường khi có dist.
- [x] `ac-3` (met): Thông điệp lỗi của test-structure khi có file orphan nêu quy tắc: test/integration/commands phải mirror src/commands, còn lại đặt ở test/integration/scenarios, test/unit mirror src.
- [x] `ac-4` (met): Toàn bộ test suite, lint, typecheck, test:gates và chuỗi nghiệm thu mục 11 pass; phiên bản 2.14.0-dev.5 (member cuối theo ID là config-detection-refresh đóng epic bằng 2.14.0).

## Required checks

- [x] `chk-focus` (focused): Test ahead/behind, measure-footprint guard, thông điệp test-structure — pass (2026-10-20 15:25:00 +07:00)
- [x] `chk-gates` (focused): Contract tests: docs, skills, instruction budget, golden — pass (2026-10-20 15:25:06 +07:00)
- [x] `check-suite` (full): Toàn bộ test suite của dự án pass — pass (2026-10-20 15:26:56 +07:00)

## Decisions

- **dec-1** — Phiên bản 2.14.0-dev.5, kind changed; ahead/behind thử bằng remote cục bộ không network.
  - _Why:_ Member cuối theo ID là config-detection-refresh nên đóng epic bằng 2.14.0 --fold-dev.

## Evidence

- `chk-focus` — pass (2026-10-20 15:25:00 +07:00): pnpm exec vitest run test/integration/scenarios/status-workspace.test.ts test/workflow/measure-footprint-guard.test.ts test/unit/test-structure.test.ts — exit 0
- `chk-gates` — pass (2026-10-20 15:25:06 +07:00): pnpm test:gates — exit 0
- `check-suite` — pass (2026-10-20 15:26:56 +07:00): pnpm test — exit 0
