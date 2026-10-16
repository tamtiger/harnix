# Tự động phát hiện .NET Solution và hỗ trợ giải pháp hỗn hợp đa hệ sinh thái

- **ID:** 20261016-163143-dotnet-solution-hybrid-discovery
- **Mode:** lite
- **Epic:** 20261016-163142-enterprise-dx-and-event-driven
- **Status:** completed/finishing
- **Created:** 2026-10-16 16:31:42 +07:00
- **Updated:** 2026-10-16 16:43:29 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Nhận diện trọn vẹn cả các microservices backend .NET (file .sln / .csproj) trong solution phức hợp có cả frontend web.

## Relevant paths

- `src/core/stack/**`
- `test/unit/core/stack/**`

## Acceptance criteria

- [x] `ac-1` (met): Bổ sung collectDotNetSolutionWorkspaces phân tích tệp .sln để bóc tách các project .csproj tương ứng.
- [x] `ac-2` (met): Cho phép nhận diện đa hệ sinh thái song song (hybrid discovery: vừa có node vừa có dotnet) mà không dừng sớm.
- [x] `ac-3` (met): verify-plan và verify-detection xuất lệnh build/test cho toàn bộ các backend microservices .NET được phát hiện.

## Required checks

- [x] `check-dotnet-discovery` (focused): Kiểm thử phát hiện .sln và các csproj con trong hybrid repo — pass (2026-10-16 16:43:03 +07:00)
- [x] `check-suite` (full): Toàn bộ test suite của dự án phải xanh — pass (2026-10-16 16:42:35 +07:00)

## Evidence

- `check-dotnet-discovery` — pass (2026-10-16 16:43:03 +07:00): pnpm vitest run test/unit/core/stack/workspace-detection.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-16 16:42:35 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
