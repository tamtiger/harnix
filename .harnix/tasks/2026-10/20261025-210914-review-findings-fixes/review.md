# Sửa các lỗi từ đợt review sau v2.22.0: phạm vi retry, rò mock, adopt, contract đóng băng, ReDoS, gợi ý id và footprint

- **ID:** 20261025-210914-review-findings-fixes
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-10-25 21:09:14 +07:00
- **Updated:** 2026-10-25 21:53:21 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 12/12 met or waived |
| Required checks | 100% | 10/10 passed |

## Goal

Sửa các lỗi mà bốn subagent review phát hiện trong thay đổi v2.22.0 (commit e3b28a8) và đưa gate measure:footprint xanh trở lại, phát hành bản vá 2.22.1.

## Non-goals

- Không thêm tính năng mới
- Không hạ ngưỡng footprint 50%, coverage hay ngân sách token

## Relevant paths

- `docs/HARNIX_PRD.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `src/commands/epic.ts`
- `src/commands/workflow-command.ts`
- `src/core/journal/learning-safety.ts`
- `src/core/managed/decision.ts`
- `src/core/tasks/read-tracker.ts`
- `src/core/workflow/run-check.ts`
- `src/core/workflow/text-integrity.ts`
- `src/skills/harnix-verify/references`
- `src/utils/suggest.ts`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +3 / -3 |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +2 / -2 |
| `docs/HARNIX_PRD.md` | modified | +1 / -1 |
| `docs/HARNIX_WORKFLOW.md` | modified | +3 / -1 |
| `docs/IMPLEMENTATION_PLAN.md` | modified | +8 / -7 |
| `package.json` | modified | +1 / -1 |
| `scripts/measure-tokens.mjs` | modified | +12 / -9 |
| `src/cli-hints.ts` | modified | +9 / -3 |
| `src/commands/epic.ts` | modified | +6 / -3 |
| `src/commands/workflow-command.ts` | modified | +7 / -1 |
| `src/commands/workflow-handler-utils.ts` | modified | +12 / -1 |
| `src/core/global/reconcile.ts` | modified | +0 / -1 |
| `src/core/journal/learning-safety.ts` | modified | +4 / -2 |
| `src/core/managed/decision.ts` | modified | +2 / -5 |
| `src/core/managed/project-files.ts` | modified | +0 / -4 |
| `src/core/tasks/read-tracker.ts` | modified | +34 / -10 |
| `src/core/workflow/finish.ts` | modified | +21 / -5 |
| `src/core/workflow/run-check.ts` | modified | +14 / -10 |
| `src/core/workflow/run-checks.ts` | modified | +1 / -1 |
| `src/core/workflow/schema.ts` | modified | +1 / -1 |
| `src/core/workflow/text-integrity.ts` | modified | +1 / -1 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +2 / -2 |
| `src/skills/harnix-plan/references/epic.md` | modified | +13 / -31 |
| `src/skills/harnix-plan/references/multi-repo.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/references/replan.md` | modified | +1 / -1 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/references/agent-transport.md` | modified | +8 / -9 |
| `src/skills/harnix-verify/references/cookbook-commands.md` | modified | +2 / -8 |
| `src/skills/harnix-verify/references/cookbook-notes.md` | modified | +32 / -23 |
| `src/skills/harnix-verify/references/evidence.md` | modified | +2 / -2 |
| `src/skills/harnix-verify/references/gates.md` | modified | +4 / -5 |
| `src/skills/harnix-verify/references/task-state.md` | modified | +5 / -5 |
| `src/skills/harnix-verify/references/workflow-routing.md` | modified | +9 / -29 |
| `src/utils/git.ts` | modified | +6 / -3 |
| `src/utils/suggest.ts` | modified | +21 / -3 |
| `test/README.md` | modified | +3 / -1 |
| `test/integration/commands/epic.test.ts` | modified | +5 / -0 |
| `test/support/learning-fixtures.ts` | modified | +3 / -2 |

_(17 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): Thử lại khi xung đột chỉ lặp phần lưu task: --run-check và --run-checks không chạy lại tiến trình check và không bỏ kết quả fail, stdin chỉ được đọc một lần, và lần thử đã ghi task thì không thử lại
- [x] `ac-2` (met): Không còn vi.mock rò giữa các file khi isolate false: learning-capture-failure dùng tiêm phụ thuộc, và chạy xáo thứ tự file với seed 1 và 2 đều xanh
- [x] `ac-3` (met): Bỏ quyết định adopt: file chưa có trong manifest luôn là collision và được giữ nguyên như kế hoạch Phase 6, test never adopts được khôi phục
- [x] `ac-4` (met): Contract đóng băng được cập nhật: IMPLEMENTATION_PLAN mục 4.25 và HARNIX_PRD ghi lỗi của workflow in PublicCliErrorV1 có hint (chỉ context im lặng), spec status --criteria ghi dạng không có task và việc từ chối --limit
- [x] `ac-5` (met): Regex CREDENTIAL và heuristic dấu hỏi chạy tuyến tính: chuỗi 64 KiB xử lý dưới 100 ms
- [x] `ac-6` (met): Gợi ý id gần nhất không đưa ra khi id rỗng, khi hai id chỉ khác phần số cuối hoặc khi có nhiều ứng viên ngang nhau; danh sách id hợp lệ vẫn được in
- [x] `ac-7` (met): Mô tả circuit breaker thống nhất ở AGENTS.md, multi-repo reference, mô tả --run-check trong schema và thông báo của run-checks: input digest mới mở lại breaker, --reset-breaker hoặc --replace-check khi user cho phép
- [x] `ac-8` (met): harnix epic: total chỉ đếm epic đọc được, và tài liệu ghi rõ thứ tự là theo id giảm dần
- [x] `ac-9` (met): Test ghi song song không chập chờn: retry có backoff ngắn hoặc số writer nhỏ hơn số lần thử
- [x] `ac-10` (met): Các lỗi P3 rẻ được sửa: hint không lấy option làm tên lệnh và bỏ Did you mean khi đã biết lệnh sở hữu cờ; isClean xét thay đổi đã stage và coi status lỗi là chưa sạch; test chứng minh pass bị stale khi sửa chữ tiêu chí; sessionLite báo lỗi khi thiếu số đo; sửa comment version-sync; harnix-plan nhắc no unknown fields; bộ lọc override tiếng Anh chạy cả trên bản bỏ dấu
- [x] `ac-11` (met): pnpm measure:footprint đạt lại mức giảm tối thiểu 50% bằng cách rút gọn phần trùng hoặc dài dòng của các reference harnix-verify thêm ở v2.21.0, harnix-plan/references/epic.md và harnix-arch-review/references/domain-briefs.md mà không bỏ nội dung bắt buộc (các test bảo vệ nội dung vẫn xanh)
- [x] `ac-12` (met): Tài liệu đồng bộ với code v2.21.1 đến v2.22.x: HARNIX_PRD dòng 159 (số action nhận --brief và danh sách action), cả hai bản mục 4.11 của IMPLEMENTATION_PLAN (--remove-risk, --remove-decision, --remove-criterion, --schema --full và transportsOmitted), mục measure:tokens (sessionLite), mô tả harnix epic; AGENTS.md (--remove-risk, --init không hỏi --command khi có --with-check, set-criterion tự quay lại implementing cho Lite); harnix-plan SKILL.md và references replan.md, epic.md (git.clean bỏ qua khác biệt cuối dòng)

## Required checks

- [x] `chk-retry` (focused): Retry chỉ lặp phần lưu — pass (2026-10-25 21:49:58 +07:00)
- [x] `chk-isolation` (focused): Xáo thứ tự file không làm rò mock — pass (2026-10-25 21:50:15 +07:00)
- [x] `chk-adopt` (focused): Không adopt file chưa có trong manifest — pass (2026-10-25 21:32:50 +07:00)
- [x] `chk-redos` (focused): Regex tuyến tính — pass (2026-10-25 21:32:54 +07:00)
- [x] `chk-suggest` (focused): Gợi ý id gần nhất và hint lệnh — pass (2026-10-25 21:50:21 +07:00)
- [x] `chk-epic` (focused): harnix epic total — pass (2026-10-25 21:33:07 +07:00)
- [x] `chk-concurrency` (focused): Ghi song song ổn định và các P3 — pass (2026-10-25 21:50:32 +07:00)
- [x] `chk-gates` (focused): Contract test, docs parity và golden — pass (2026-10-25 21:50:39 +07:00)
- [x] `chk-footprint` (focused): Footprint giảm tối thiểu 50% — pass (2026-10-25 21:50:43 +07:00)
- [x] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-25 21:52:12 +07:00)

## Evidence

- skipped (2026-10-25 21:12:35 +07:00): Task contract revised at persisted replan: Rà soát đồng bộ tài liệu theo yêu cầu người dùng phát hiện thêm các chỗ lệch ngoài ac-4, ac-7 và ac-8
- `chk-retry` — pass (2026-10-25 21:49:58 +07:00): pnpm exec vitest run test/unit/core/tasks/read-tracker.test.ts test/integration/commands/workflow-command.test.ts test/unit/core/workflow/run-check.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-isolation` — pass (2026-10-25 21:50:15 +07:00): pnpm exec vitest run test/workflow/learning-capture-failure.test.ts test/workflow/learning-automation.test.ts test/unit/core/journal --maxWorkers=1 --sequence.shuffle.files --sequence.seed=1 — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-adopt` — pass (2026-10-25 21:32:50 +07:00): pnpm exec vitest run test/unit/core/managed test/unit/core/global/reconcile.test.ts — exit 0
- `chk-redos` — pass (2026-10-25 21:32:54 +07:00): pnpm exec vitest run test/unit/core/journal/learning-safety.test.ts test/unit/core/workflow/text-integrity.test.ts — exit 0
- `chk-suggest` — pass (2026-10-25 21:50:21 +07:00): pnpm exec vitest run test/unit/utils/suggest.test.ts test/unit/cli-hints.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-epic` — pass (2026-10-25 21:33:07 +07:00): pnpm exec vitest run test/integration/commands/epic.test.ts — exit 0
- `chk-concurrency` — pass (2026-10-25 21:50:32 +07:00): pnpm exec vitest run test/unit/core/workflow/plan-edit.test.ts test/unit/utils/git.test.ts test/workflow/measure-tokens.test.ts test/unit/core/workflow/set-criterion.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-gates` — pass (2026-10-25 21:50:39 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-25 21:52:12 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- skipped (2026-10-25 21:41:08 +07:00): Task contract revised at persisted replan: Rút gọn riêng sáu reference harnix-verify chỉ đạt 48,75%; người dùng chọn mở rộng sang epic.md và domain-briefs.md
- `chk-footprint` — pass (2026-10-25 21:50:43 +07:00): pnpm measure:footprint — exit 0
