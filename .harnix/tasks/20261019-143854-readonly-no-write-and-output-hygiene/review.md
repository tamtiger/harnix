# Lệnh read-only không ghi .harnix và làm sạch đầu ra tự sinh

- **ID:** 20261019-143854-readonly-no-write-and-output-hygiene
- **Mode:** full
- **Epic:** 20261019-143847-field-defects-hardening
- **Status:** completed/finishing
- **Created:** 2026-10-19 14:38:47 +07:00
- **Updated:** 2026-10-19 16:39:26 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 5/5 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Tái hiện và chặn việc sinh thư mục .harnix rác ở repo chưa init, làm secretAdvisory tôn trọng .gitignore, dùng mẫu prd/plan trung tính và gọn đầu ra preflight.

## Non-goals

- Không đổi nội dung các prd/plan đã có.
- Không bật quét mạng hay phụ thuộc bắt buộc vào Git.

## Relevant paths

- `src/core/workflow/artifact-templates.ts`
- `src/core/workflow/brief.ts`
- `src/core/workflow/secret-scan.ts`
- `test/integration/scenarios/read-only-commands.test.ts`
- `test/unit/core/workflow/artifact-templates.test.ts`
- `test/unit/core/workflow/brief.test.ts`
- `test/unit/core/workflow/secret-scan.test.ts`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- [x] `ac-1` (met): Có test hồi quy: các lệnh read-only (status, verify-plan, repo-map --query, context-report, tasks, epic, workflow --preflight, workflow --inspect) chạy ở thư mục chưa init không tạo hay đổi file nào, kể cả .harnix; chỉ sửa mã nếu test phát hiện một lệnh ghi thật.
- [x] `ac-2` (met): secretAdvisory tôn trọng .gitignore: file bị ignore không được quét, file không bị ignore vẫn được báo; vẫn offline, giới hạn và không trả giá trị bí mật.
- [x] `ac-3` (met): prd.md và plan.md sinh bởi --init --mode full dùng câu trung tính trỏ tới AGENTS.md và .harnix/spec/guides/, không còn câu riêng của Harnix (300 LOC, commands -> core, giới hạn LOC), giữ nguyên các tiêu đề mục.
- [x] `ac-4` (met): Có test hồi quy giữ hành vi hiện tại của workflow --preflight --brief: bỏ learning, giữ các trường còn lại; epicContext chỉ có khi chưa có task active và không đổi.
- [x] `ac-5` (met): Toàn bộ test suite của dự án và test:gates pass.

## Required checks

- [x] `chk-focus` (focused): Test read-only, secret-scan, mẫu init và preflight brief — pass (2026-10-19 16:37:32 +07:00)
- [x] `check-suite` (full): Toàn bộ test suite của dự án pass — pass (2026-10-19 16:38:55 +07:00)
- [x] `chk-gates` (focused): Contract tests (test:gates) và bộ test của dự án phải xanh — pass (2026-10-19 16:37:37 +07:00)

## Decisions

- **dec-1** — Không đổi preflight vì --brief đã lược learning và epicContext; chỉ thêm test hồi quy.
  - _Why:_ Đã kiểm tra thực tế: preflight đầy đủ khoảng 1,6 KB, bản --brief không có hai trường đó.

## Evidence

- `chk-focus` — pass (2026-10-19 16:37:32 +07:00): pnpm exec vitest run test/unit/core/workflow/secret-scan.test.ts test/unit/core/workflow/artifact-templates.test.ts test/unit/core/workflow/brief.test.ts test/integration/scenarios/read-only-comman... — exit 0
- `chk-gates` — pass (2026-10-19 16:37:37 +07:00): pnpm test:gates — exit 0
- `check-suite` — pass (2026-10-19 16:38:55 +07:00): pnpm test — exit 0
