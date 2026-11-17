# Gợi ý đường dẫn đúng khi repo-map không tìm thấy file

- **ID:** 20261116-165142-repo-map-path-hints
- **Mode:** lite
- **Epic:** 20261116-165141-repo-map-usability
- **Status:** completed/finishing
- **Created:** 2026-11-16 16:51:40 +07:00
- **Updated:** 2026-11-16 17:08:07 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Khi đường dẫn truyền vào không có trong bản đồ, repo-map trả not-found kèm đường dẫn gần đúng thay vì skipped kèm hint refresh vô ích, và nhận đường dẫn tương đối theo thư mục đang đứng.

## Non-goals

- Không đổi định dạng đã có của các trường hiện hành; chỉ thêm trường hoặc cờ mới.

## Relevant paths

- `src/core/repo-map/outline-body.ts`
- `src/core/repo-map/outline.ts`
- `src/commands/repo-map-internal.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -1 |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/commands/repo-map-internal.ts` | modified | +15 / -19 |
| `src/commands/repo-map-root.ts` | added | - |
| `src/core/repo-map/impact.ts` | modified | +2 / -0 |
| `src/core/repo-map/outline-body.ts` | modified | +12 / -1 |
| `src/core/repo-map/path-hints.ts` | added | - |
| `src/core/repo-map/service.ts` | modified | +23 / -3 |
| `src/core/repo-map/tests.ts` | modified | +2 / -0 |
| `src/core/repo-map/types.ts` | modified | +2 / -0 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +1 / -1 |
| `test/integration/commands/repo-map-root.test.ts` | added | - |
| `test/integration/scenarios/repo-map-paths.test.ts` | added | - |
| `test/unit/core/repo-map/outline-body.test.ts` | modified | +15 / -0 |
| `test/unit/core/repo-map/path-hints.test.ts` | added | - |
| `test/unit/core/repo-map/service.test.ts` | modified | +29 / -1 |

## Acceptance criteria

- [x] `ac-1` (met): `--outline <path> --symbol <name> --body` với đường dẫn không trỏ tới file nào trả status not-found kèm `suggestions` (không phải skipped kèm hint `--refresh`), giống `--outline` không có `--body`; file có trên đĩa nhưng chưa có trong bản đồ vẫn trả skipped kèm hint refresh.
- [x] `ac-2` (met): `--outline`, `--impact` và `--tests` khi không tìm thấy đường dẫn đều trả cùng danh sách gợi ý (tối đa 3 đường dẫn trong bản đồ có cùng tên file hoặc cùng hậu tố), và không gợi ý khi không có đường dẫn nào gần đúng.
- [x] `ac-3` (met): Chạy từ một thư mục con của dự án, đường dẫn tương đối theo thư mục đó được chuẩn hóa về đường dẫn tương đối theo gốc dự án trước khi tra; đường dẫn đã tương đối theo gốc vẫn dùng như cũ và `..` thoát khỏi dự án vẫn bị từ chối.

## Required checks

- [x] `chk-1` (focused): Test tập trung của repo-map-path-hints — pass (2026-11-16 17:06:13 +07:00)
- [x] `chk-2` (full): Bộ test toàn dự án — pass (2026-11-16 17:07:40 +07:00)

## Evidence

- skipped (2026-11-16 17:05:37 +07:00): Task contract revised at persisted replan: Làm rõ: hint refresh vẫn đúng cho file tồn tại mà chưa vào bản đồ; chỉ đường dẫn không trỏ tới file nào mới là not-found
- `chk-1` — pass (2026-11-16 17:06:13 +07:00): pnpm exec vitest run test/unit/core/repo-map/outline.test.ts test/unit/core/repo-map/outline-body.test.ts test/integration/commands/repo-map-internal.test.ts — exit 0
- `chk-2` — pass (2026-11-16 17:07:40 +07:00): pnpm test — exit 0
