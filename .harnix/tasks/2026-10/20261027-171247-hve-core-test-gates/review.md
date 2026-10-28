# Thêm test hàng rào học từ hve-core: lệnh bị từ chối không ghi gì, catalog finding doctor, nguồn lockfile

- **ID:** 20261027-171247-hve-core-test-gates
- **Mode:** lite
- **Status:** completed/finishing
- **Created:** 2026-10-27 17:12:47 +07:00
- **Updated:** 2026-10-28 13:48:48 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 5/5 met or waived |
| Required checks | 100% | 3/3 passed |
| Residual risks | 1 | risk-1: low |

## Goal

Thêm các test xác định (không cần mô hình) bắt hồi quy: lệnh ghi bị từ chối để nguyên cây .harnix, mỗi mã finding của doctor có test sinh ra nó cùng fixture sạch, lockfile không chứa nguồn lạ; kèm quy tắc doc cho finding mới và rubric duyệt SKILL.md.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -1 |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `scripts/scan-lockfile.mjs` | added | - |
| `scripts/scan-release.mjs` | modified | +3 / -0 |
| `src/core/doctor/finding-codes-global.ts` | added | - |
| `src/core/doctor/finding-codes-project.ts` | added | - |
| `src/core/doctor/finding-codes.ts` | added | - |
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
| `test/integration/scenarios/rejected-writes.test.ts` | added | - |
| `test/safety/release-scanner.test.ts` | modified | +31 / -0 |
| `test/unit/core/doctor/finding-codes.test.ts` | added | - |
| `test/workflow/docs-task-contract.test.ts` | modified | +12 / -0 |
| `test/workflow/doctor-finding-fixtures-2.test.ts` | added | - |
| `test/workflow/doctor-finding-fixtures-global.test.ts` | added | - |
| `test/workflow/doctor-finding-fixtures-project.test.ts` | added | - |

## Acceptance criteria

- [x] `ac-1` (met): Một bảng test chứng minh mỗi lệnh harnix workflow ghi bị từ chối (transition sai, evidence ghi giờ tương lai, check bị circuit breaker, --save chứa mojibake, ghi vào task đã archive) để nguyên cây .harnix: băm toàn bộ cây trước và sau rồi so bằng nhau, kèm mã thoát và thông điệp lỗi.
- [x] `ac-2` (met): Mọi mã finding của harnix doctor nằm trong một catalog DOCTOR_FINDING_CODES (mã tĩnh và mã dựng theo nền tảng) chia thành các file src/core/doctor không quá 300 dòng; một test duyệt catalog khẳng định mỗi mã có ít nhất một fixture sinh ra nó, và một dự án sạch cho 0 finding.
- [x] `ac-3` (met): scripts/scan-release-assertions.mjs kiểm pnpm-lock.yaml và package.json: không có tarball, URL http, URL git hay thông tin đăng nhập, và registry chỉ là npmjs; test trong test/safety/release-scanner.test.ts cho từng trường hợp vi phạm lẫn trường hợp sạch.
- [x] `ac-4` (met): AGENTS.md hoặc test/README.md ghi hai quy tắc ngắn (finding doctor mới ra mức warning trước; checklist duyệt khi sửa SKILL.md), và test/workflow/docs-task-contract.test.ts khẳng định cả hai câu còn có mặt.
- [x] `ac-5` (met): Một lần bump patch bằng pnpm version:sync kèm mục CHANGELOG, vì catalog doctor và quét release là thay đổi mã nguồn và script phát hành.

## Required checks

- [x] `chk-focused` (focused): Test tập trung cho bảng lệnh ghi bị từ chối, catalog doctor và fixture, quét lockfile — pass (2026-10-28 13:47:06 +07:00)
- [x] `chk-gates` (focused): Test hợp đồng — pass (2026-10-28 13:47:14 +07:00)
- [x] `chk-suite` (full): Toàn bộ suite — pass (2026-10-28 13:48:40 +07:00)

## Residual risks

- **risk-1** (low) — workflow.md template vẫn nhắc pnpm run test:gates; ba mã doctor (global-managed-drift, journal-unreadable, permission-check-failed) chưa có fixture thật vì cần mock module, ghi trong CODES_WITHOUT_REAL_FIXTURE.

## Evidence

- `check-1` — fail (2026-10-28 13:44:54 +07:00): pnpm exec vitest run test/integration/scenarios test/unit/core/doctor test/safety/release-scanner.test.ts test/workflow/docs-task-contract.test.ts — exit 1
- `chk-gates` — pass (2026-10-28 13:47:14 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- skipped (2026-10-28 13:46:44 +07:00): Task contract revised at persisted replan: fixture doctor chuyển sang test/workflow vì test:gates cấm vi.mock và buộc test/unit phản chiếu src
- `chk-focused` — pass (2026-10-28 13:47:06 +07:00): pnpm exec vitest run test/integration/scenarios test/unit/core/doctor test/workflow/doctor-finding-fixtures-global.test.ts test/workflow/doctor-finding-fixtures-project.test.ts test/workflow/doctor... — exit 0
- `chk-suite` — pass (2026-10-28 13:48:40 +07:00): pnpm test — exit 0
