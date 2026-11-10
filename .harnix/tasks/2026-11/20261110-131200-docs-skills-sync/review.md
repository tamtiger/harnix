# Đồng bộ tài liệu, skill và token budget (đóng epic)

- **ID:** 20261110-131200-docs-skills-sync
- **Mode:** full
- **Epic:** 20261110-131151-harnix-review-refactor
- **Status:** completed/finishing
- **Created:** 2026-11-10 13:11:51 +07:00
- **Updated:** 2026-11-10 15:05:36 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 2/2 passed |
| Residual risks | 5 | budget-usage-technique-ceiling: low, changelog-date-order: low, review-update-swallow-roots: low, review-test-layout: low, review-commit-split: low |

## Goal

Loại lệnh riêng repo khỏi template và skill, sửa đường dẫn sai và tham chiếu treo, đồng bộ README, PRD, CHANGELOG và công cụ đo token; đóng epic bằng bản phát hành minor và release:check.

## Non-goals

- Không nâng trần token
- Không đổi frozen contract

## Relevant paths

- `AGENTS.md`
- `CHANGELOG.md`
- `README.md`
- `docs`
- `scripts/token-budget-usage.mjs`
- `src/skills`
- `src/templates`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +2 / -2 |
| `CHANGELOG.md` | modified | +16 / -0 |
| `README.md` | modified | +32 / -29 |
| `docs/HARNIX_PRD.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/commands/global-uninstall.ts` | modified | +2 / -1 |
| `src/commands/global-update.ts` | modified | +2 / -1 |
| `src/commands/legacy-project-surfaces.ts` | modified | +1 / -4 |
| `src/commands/mem.ts` | modified | +2 / -2 |
| `src/commands/pause.ts` | modified | +2 / -1 |
| `src/commands/repo-map-internal.ts` | modified | +2 / -2 |
| `src/commands/resume.ts` | modified | +8 / -3 |
| `src/commands/setup.ts` | modified | +2 / -1 |
| `src/commands/skills-extension.ts` | deleted | +0 / -38 |
| `src/commands/status.ts` | modified | +4 / -7 |
| `src/commands/update.ts` | modified | +2 / -2 |
| `src/commands/workflow-handler-utils.ts` | modified | +23 / -8 |
| `src/commands/workflow-handlers.ts` | modified | +12 / -3 |
| `src/commands/workflow-lifecycle-handlers.ts` | modified | +11 / -7 |
| `src/core/config/config-schema.ts` | modified | +0 / -1 |
| `src/core/config/config-validate.ts` | modified | +2 / -1 |
| `src/core/context/context.ts` | modified | +2 / -6 |
| `src/core/context/effective-context.ts` | modified | +2 / -7 |
| `src/core/context/selection-freshness.ts` | modified | +1 / -1 |
| `src/core/doctor/doctor.ts` | modified | +43 / -23 |
| `src/core/doctor/finding-codes-project.ts` | modified | +2 / -0 |
| `src/core/doctor/finding-codes.ts` | modified | +1 / -1 |
| `src/core/doctor/findings.ts` | modified | +0 / -4 |
| `src/core/doctor/global-inspect.ts` | modified | +4 / -3 |
| `src/core/doctor/project-legacy.ts` | modified | +4 / -3 |
| `src/core/doctor/project-tasks.ts` | modified | +27 / -6 |
| `src/core/doctor/project.ts` | modified | +4 / -10 |
| `src/core/epics/epic-location.ts` | modified | +2 / -2 |
| `src/core/epics/epic.ts` | modified | +22 / -2 |
| `src/core/global/discovery.ts` | modified | +8 / -19 |
| `src/core/global/locking.ts` | modified | +5 / -2 |
| `src/core/global/managed-json.ts` | modified | +1 / -4 |
| `src/core/global/manifest.ts` | modified | +2 / -5 |
| `src/core/global/setup.ts` | modified | +6 / -0 |
| `src/core/global/toml-guard.ts` | modified | +5 / -2 |
| `src/core/global/transaction.ts` | modified | +41 / -3 |
| `src/core/global/uninstall.ts` | modified | +7 / -4 |
| `src/core/global/update.ts` | modified | +9 / -10 |
| `src/core/journal/journal.ts` | modified | +5 / -9 |
| `src/core/journal/learned-promote.ts` | modified | +2 / -1 |
| `src/core/journal/learning-quality.ts` | modified | +2 / -2 |
| `src/core/journal/learning-relevance.ts` | modified | +1 / -1 |
| `src/core/journal/learning-review.ts` | modified | +1 / -1 |
| `src/core/journal/learning-safety.ts` | modified | +1 / -1 |
| `src/core/managed/project-files.ts` | modified | +3 / -15 |

_(108 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): Template workflow.md không còn lệnh riêng repo (test:gates, version:sync, selfhost:sync); test docs-task-contract và repoOnly được cập nhật; pnpm selfhost:sync đã chạy.
- [x] `ac-2` (met): AGENTS.md mục 8 và skill harnix-self-host dùng đường dẫn đúng; AGENTS.md không liệt kê số trần token.
- [x] `ac-3` (met): Bảy skill technique bỏ tham chiếu Evidence source treo; sáu reference mồ côi có dòng trỏ tới; quy tắc lặp về version và review timing được rút gọn; lệnh riêng repo chuyển khỏi skill.
- [x] `ac-4` (met): README, PRD và danh mục tài liệu đồng bộ (không còn số token cũ, có link tới ba tài liệu mồ côi, flag resume đủ, trạng thái PRD trỏ tới CHANGELOG).

## Required checks

- [x] `chk-focus` (focused): Test tập trung của member — pass (2026-11-10 14:45:04 +07:00)
- [x] `chk-suite` (full): Toàn bộ suite của dự án — pass (2026-11-10 15:01:42 +07:00)

## Residual risks

- **budget-usage-technique-ceiling** (low) — scripts/token-budget-usage.mjs tính trần skill technique theo trần skill chung (2000) nên báo phần trăm thấp hơn thực tế so với trần techniqueSkill; sửa cần nguồn danh sách skill technique dùng chung giữa script và TypeScript.
- **changelog-date-order** (low) — CHANGELOG 2.24.0 mang ngày 2026-11-01 nhưng đứng sau 2.25.0 và 2.26.0 ngày 2026-10-30; chưa sửa ngày lịch sử.
- **review-update-swallow-roots** (low) — update.ts bỏ qua im lặng platform có root không resolve được (kể cả lỗi an toàn đường dẫn), chưa báo lý do trong kết quả.
- **review-test-layout** (low) — test/safety/process-timeout.test.ts nằm ngoài ranh giới an toàn mô tả trong test/README.md nhưng check-runner.test.ts đã sát trần 400 dòng; một số test chờ khóa còn dùng timer thật cho cửa sổ chờ; thiếu test mã lỗi errno của hashEntries; một lần chạy suite của reviewer có 1 test fail không lặp lại, chưa rõ tên.
- **review-commit-split** (low) — Working tree trộn sửa hành vi của các member 1 đến 5 với hai refactor thuần của member 6 và 7; khi commit nên tách theo task để giữ khả năng bisect.

## Evidence

- skipped (2026-11-10 14:43:30 +07:00): Task contract revised at persisted replan: Công cụ đo token budgetUsage cần biết danh sách skill technique mà script không đọc được từ TypeScript; thêm một danh sách tên thứ hai sẽ phá nguyên tắc một nguồn sự thật nên ghi thành residual risk.
- `chk-focus` — pass (2026-11-10 14:45:04 +07:00): pnpm test:gates — exit 0
- `chk-suite` — pass (2026-11-10 15:01:42 +07:00): pnpm test — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
