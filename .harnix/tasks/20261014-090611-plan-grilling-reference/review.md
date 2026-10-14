# Thêm các reference từ nguồn ngoài vào skill Harnix và phát hành 2.5.0

- **ID:** 20261014-090611-plan-grilling-reference
- **Mode:** lite
- **Epic:** 20261014-090610-harnix-skill-upstream-adoption
- **Status:** completed/finishing
- **Created:** 2026-10-14 09:06:10 +07:00
- **Updated:** 2026-10-14 13:32:10 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 5/5 met or waived |
| Required checks | 100% | 2/2 passed |
| Residual risks | 1 | rsk-1: medium |

## Goal

Thêm reference grilling (harnix-plan), rationalizations (harnix-verify), phản biện và phát hiện nới ngưỡng (harnix-verification-gap), hai trục Standards/Spec (harnix-review), feedback-loop (harnix-debug); đóng epic bằng bản phát hành minor 2.5.0 (--fold-dev).

## Non-goals

- Không thêm skill, lệnh, nền tảng, persona agent hay subagent bắt buộc
- Không chép nguyên văn nội dung nguồn; viết lại bằng ngôn ngữ Harnix
- Không vượt ngân sách token của skill (test instruction-budget)

## Relevant paths

- `CHANGELOG.md`
- `docs/HARNIX_PRD.md`
- `docs/HARNIX_WORKFLOW.md`
- `package.json`
- `src/skills/**`
- `src/skills/catalog.ts`
- `src/templates/harnix/workflow.md`
- `test/**`

## Relevant specs

- `docs/UPSTREAM_MAPPING.md`

## Acceptance criteria

- [x] `ac-1` (met): Reference grilling của harnix-plan nạp được, trigger ở đầu dòng con trỏ, nêu rõ không dùng khi Bypass hoặc chạy tự động và không tạo tệp ý định mới
- [x] `ac-2` (met): harnix-verify có reference rationalizations; harnix-verification-gap có mục phản biện (không bắt buộc subagent) và checklist nới ngưỡng; harnix-review giữ hai trục Standards/Spec tách riêng
- [x] `ac-3` (met): harnix-debug có reference feedback-loop khớp quy tắc một giả thuyết và regression test; mọi skill vẫn trong ngân sách 2.000 token
- [x] `ac-4` (met): Phát hành 2.5.0 bằng version:sync --fold-dev (CHANGELOG gộp một mục), selfhost:sync nếu template đổi, và mọi gate (test, lint, typecheck, test:gates) có exit code 0 mới
- [x] `ac-5` (met): harnix-review bổ sung nguyên lý Chesterton's Fence và smell baseline; reference feedback-loop của harnix-debug có kỹ thuật Forced Mutation

## Required checks

- [x] `check-gates` (focused): Contract tests (cấu trúc skill, ngân sách token, guide) — pass (2026-10-14 13:30:16 +07:00)
- [x] `check-suite-v2` (full): Replacement for check-suite — pass (2026-10-14 13:31:19 +07:00)

## Decisions

- **dec-1** — Bổ sung Chesterton's Fence, Forced Mutation và Smell Baseline vào references
  - _Why:_ Chọn lọc từ addyosmani/agent-skills và mattpocock/skills để nâng cao chất lượng review, debug và bảo toàn test nhạy

## Residual risks

- **rsk-1** (medium) — Cập nhật integration test test/integration/commands/skills.test.ts và unit test catalog.test.ts để khớp mảng references và regex lỗi

## Evidence

- `check-gates` — pass (2026-10-14 13:30:16 +07:00): pnpm test:gates — exit 0 _(3 earlier reruns not shown; see task.json for full history)_
- `check-suite` — fail (2026-10-14 13:26:26 +07:00): pnpm test — exit 1 _(1 earlier rerun not shown; see task.json for full history)_
- skipped (2026-10-14 13:30:00 +07:00): Task contract revised at persisted replan: Khac phuc EPERM transient rename tren Windows trong learned-promote test bang viec tang retry delays, chay lai toan bo test suite
- `check-suite-v2` — pass (2026-10-14 13:31:19 +07:00): pnpm test — exit 0
