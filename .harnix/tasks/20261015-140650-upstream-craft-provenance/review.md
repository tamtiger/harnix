# Ghi nhận nguồn provenance, giấy phép và đăng ký feature registry cho ai-native-client và ak-quick-setup

- **ID:** 20261015-140650-upstream-craft-provenance
- **Mode:** lite
- **Epic:** 20261015-140650-harnix-craft-and-quality-adoption
- **Status:** completed/finishing
- **Created:** 2026-10-15 14:06:50 +07:00
- **Updated:** 2026-10-15 14:18:15 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Cập nhật NOTICE, UPSTREAM_BASELINE.md, UPSTREAM_MAPPING.md, đăng ký feature provenance craft-and-decision-discipline và cập nhật test kiểm chứng provenance.

## Relevant paths

- `NOTICE`
- `docs/HARNESS_FEATURE_PROVENANCE.json`
- `docs/UPSTREAM_BASELINE.md`
- `docs/UPSTREAM_MAPPING.md`
- `package.json`
- `test/workflow/provenance.test.ts`

## Relevant specs

- `docs/HARNIX_PRD.md`
- `docs/HARNIX_WORKFLOW.md`

## Acceptance criteria

- [x] `ac-1` (met): File NOTICE chứa đầy đủ thông tin bản quyền và attribution cho tác giả của AgentKit và KiroCrew.
- [x] `ac-2` (met): docs/UPSTREAM_BASELINE.md và docs/UPSTREAM_MAPPING.md ghi nhận đầy đủ nguồn gốc, commit SHA, giấy phép và bảng mapping các thành phần Adopt/Adapt/Reject.
- [x] `ac-3` (met): docs/HARNESS_FEATURE_PROVENANCE.json và test/workflow/provenance.test.ts đăng ký hợp lệ feature craft-and-decision-discipline, pnpm vitest run test/workflow/provenance.test.ts pass 100%.
- [x] `ac-4` (met): Phiên bản package được bump thành 2.6.0-dev.1 qua pnpm version:sync.

## Required checks

- [x] `check-1` (focused): Kiểm tra kiểm chứng provenance, bản quyền và version 2.6.0-dev.1 — pass (2026-10-15 14:16:00 +07:00)
- [x] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-15 14:17:35 +07:00)

## Evidence

- `check-1` — pass (2026-10-15 14:16:00 +07:00): pnpm vitest run test/workflow/provenance.test.ts — exit 0
- `check-suite` — pass (2026-10-15 14:17:35 +07:00): pnpm test — exit 0
