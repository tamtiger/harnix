# Sửa cổng measure:footprint đang đỏ do giả định readiness sai

- **ID:** 20261020-104846-fix-measure-footprint-gate
- **Mode:** lite
- **Epic:** 20261020-104845-workspace-and-gate-improvements
- **Status:** completed/finishing
- **Created:** 2026-10-20 10:48:45 +07:00
- **Updated:** 2026-10-20 11:27:20 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Để scripts/measure-footprint.mjs không tự suy ra trạng thái cần xử lý từ readiness khác installed mà dựa vào chính hợp đồng của setup (exit 1 khi và chỉ khi có nội dung trên stderr), nên cổng không còn đỏ với Codex ở installed-pending-trust.

## Non-goals

- Không đổi hành vi của harnix setup hay registry nền tảng.
- Không hạ ngưỡng giảm 50% của footprint.

## Relevant paths

- `scripts/measure-footprint.mjs`
- `test/workflow/package-contract.test.ts`

## Acceptance criteria

- [x] `ac-1` (met): pnpm run measure:footprint exit 0 sau pnpm build: script không còn dùng điều kiện readiness khác installed để kỳ vọng exit 1; Codex ở installed-pending-trust (readiness khỏe theo registry) không làm cổng fail.
- [x] `ac-2` (met): assertSetupExitContract vẫn kiểm hợp đồng: JSON hợp lệ có scope user và mảng platforms; setup thoát 1 chỉ khi stderr có nội dung (stderr không rỗng không suy ra thoát 1 vì setupNotice của Codex nằm ở stderr với thoát 0); mọi platform có readiness installed hoặc installed-pending-trust và không warning thì thoát 0; một fixture đầu vào giả cho script chứng minh script vẫn lỗi khi thoát 1 mà stderr rỗng.
- [x] `ac-3` (met): Toàn bộ test suite của dự án và test:gates pass.

## Required checks

- [x] `chk-measure` (focused): measure:footprint exit 0 sau build (cần dist/ có sẵn) — pass (2026-10-20 11:25:40 +07:00)
- [x] `chk-gates` (focused): Contract tests: docs, skills, instruction budget, golden — pass (2026-10-20 11:25:44 +07:00)
- [x] `check-suite` (full): Toàn bộ test suite của dự án pass — pass (2026-10-20 11:26:51 +07:00)

## Decisions

- **dec-1** — Dùng sự hiện diện của stderr làm tín hiệu cần xử lý thay vì sao chép logic healthyReadiness của registry vào script.
  - _Why:_ CLI chỉ ghi stderr khi có readiness không khỏe hoặc cảnh báo (reportActionableSetupReadiness); script .mjs không import được registry từ bản bundle, và sao chép bảng readiness sẽ lại lệch khi thêm nền tảng.
- **dec-ver** — Phiên bản 2.13.0-dev.1, kind fixed. Hợp đồng: thoát 1 kéo theo stderr khác rỗng, không ngược lại (setupNotice của Codex ở stderr với thoát 0); healthy gồm installed và installed-pending-trust.
  - _Why:_ Review: đọc reportActionableSetupReadiness trong src/cli-helpers.ts và healthyReadiness của Codex.

## Evidence

- `chk-measure` — pass (2026-10-20 11:25:40 +07:00): pnpm measure:footprint — exit 0
- `chk-gates` — pass (2026-10-20 11:25:44 +07:00): pnpm test:gates — exit 0
- `check-suite` — pass (2026-10-20 11:26:51 +07:00): pnpm test — exit 0
