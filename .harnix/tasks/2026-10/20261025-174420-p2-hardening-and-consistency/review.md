# Sửa lỗi P2: breaker skipped giả, cờ không owner, status --criteria, restore-artifacts, crash giữa transaction

- **ID:** 20261025-174420-p2-hardening-and-consistency
- **Mode:** full
- **Epic:** 20261025-174418-hardening-and-token-diet
- **Status:** completed/finishing
- **Created:** 2026-10-25 17:44:20 +07:00
- **Updated:** 2026-10-25 19:34:36 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 10/10 met or waived |
| Required checks | 100% | 10/10 passed |
| Residual risks | 7 | r-lock-path: medium, r-dangling-link: medium, r-fsync: low, r-plan-sync: low, r-launcher: medium, r-hook-cache: low, r-noop-flags: low |

## Goal

Xử lý các lỗi P2 đã tái hiện: evidence skipped giả mở breaker, cờ được nhận im lặng, status --criteria khác hành vi, id learning thô, restore-artifacts dùng task.id, collision vĩnh viễn sau crash; đồng bộ --run-checks với quyết định A3 (breaker mở lại khi digest đổi) và tài liệu với quyết định A5 (sửa chữ tiêu chí có evidence kèm --reason); sửa ba lỗi P3 rẻ. Các nghi vấn chưa tái hiện được ghi làm residual risk.

## Non-goals

- Không refactor cấu trúc action/flag
- Không tối ưu token

## Relevant paths

- `src/core/workflow/completion.ts`
- `src/commands/workflow-flag-owners.ts`
- `src/commands/status.ts`
- `src/commands/learning.ts`
- `src/core/doctor/restore-artifacts.ts`
- `src/core/global/transaction.ts`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +4 / -4 |
| `CHANGELOG.md` | modified | +12 / -0 |
| `README.md` | modified | +2 / -2 |
| `docs/HARNIX_PRD.md` | modified | +1 / -1 |
| `docs/HARNIX_WORKFLOW.md` | modified | +6 / -0 |
| `package.json` | modified | +1 / -1 |
| `src/cli-helpers.ts` | modified | +13 / -3 |
| `src/cli-hints.ts` | added | - |
| `src/cli-program.ts` | modified | +7 / -6 |
| `src/cli-workflow-commands.ts` | modified | +2 / -2 |
| `src/commands/epic.ts` | modified | +5 / -2 |
| `src/commands/learning.ts` | modified | +2 / -1 |
| `src/commands/skills.ts` | modified | +7 / -1 |
| `src/commands/status.ts` | modified | +5 / -4 |
| `src/commands/workflow-command.ts` | modified | +2 / -1 |
| `src/commands/workflow-flag-owners.ts` | modified | +3 / -0 |
| `src/commands/workflow-flags.ts` | modified | +20 / -2 |
| `src/commands/workflow-handlers.ts` | modified | +3 / -1 |
| `src/core/doctor/restore-artifacts.ts` | modified | +2 / -1 |
| `src/core/global/reconcile.ts` | modified | +1 / -0 |
| `src/core/journal/learning-safety.ts` | modified | +13 / -3 |
| `src/core/managed/decision.ts` | modified | +5 / -2 |
| `src/core/managed/project-files.ts` | modified | +4 / -0 |
| `src/core/repo-map/store.ts` | modified | +1 / -1 |
| `src/core/stack/verify-plan.ts` | modified | +4 / -6 |
| `src/core/tasks/read-tracker.ts` | added | - |
| `src/core/tasks/task-store.ts` | modified | +4 / -1 |
| `src/core/workflow/baseline.ts` | modified | +7 / -1 |
| `src/core/workflow/completion.ts` | modified | +13 / -1 |
| `src/core/workflow/criterion.ts` | modified | +8 / -1 |
| `src/core/workflow/evidence-flags.ts` | modified | +8 / -1 |
| `src/core/workflow/plan-edit.ts` | modified | +7 / -1 |
| `src/core/workflow/plan-remove.ts` | modified | +21 / -3 |
| `src/core/workflow/replace-check.ts` | modified | +8 / -1 |
| `src/core/workflow/reset-breaker.ts` | modified | +11 / -4 |
| `src/core/workflow/run-check.ts` | modified | +8 / -1 |
| `src/core/workflow/run-checks.ts` | modified | +4 / -1 |
| `src/core/workflow/save.ts` | modified | +44 / -2 |
| `src/core/workflow/schema.ts` | modified | +1 / -1 |
| `src/core/workflow/set-criterion.ts` | modified | +7 / -1 |
| `src/core/workflow/text-integrity.ts` | modified | +6 / -2 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/references/replan.md` | modified | +1 / -1 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |

_(36 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): Evidence skipped có summary giả dạng reset không mở circuit breaker; chỉ --reset-breaker hợp lệ mới mở
- [x] `ac-2` (met): Các cờ --exit-code, --artifact, --digest và --file ở chế độ không hỗ trợ bị từ chối; --check lặp lại không bị ghép thành một id
- [x] `ac-3` (met): status --criteria không có task trả null như các chế độ status khác và từ chối --limit
- [x] `ac-4` (met): learning --reject/--retire/--promote chuẩn hóa id (dấu phẩy cuối, khoảng trắng, trùng lặp)
- [x] `ac-5` (met): doctor --fix restoreFullArtifacts chỉ ghi vào thư mục khớp task.id và bỏ qua task lệch id
- [x] `ac-6` (met): Crash giữa ghi file và ghi manifest không để lại collision vĩnh viễn: nội dung đã đúng mong muốn được nhận lại
- [x] `ac-7` (met): AGENTS.md và docs ghi đúng hành vi: --set-criterion sửa được chữ tiêu chí đã có evidence khi có --reason, pass cũ thành stale và lý do được ghi vết contractRevision
- [x] `ac-8` (met): --run-checks truyền input digest hiện tại vào circuit breaker như --run-check, nên check đã fail hai lần chạy lại được sau khi input đổi; AGENTS.md và docs ghi breaker mở lại khi input digest đổi
- [x] `ac-9` (met): Ba lỗi P3 rẻ được sửa: AGENTS.md ghi --full thay cho --no-brief, repoMapCachePath dùng path join đúng trên POSIX, text-integrity không chặn chuỗi ba dấu hỏi liên tiếp trong text ASCII thuần
- [x] `ac-10` (met): Lệnh sai trả lỗi kèm gợi ý lệnh đúng: cờ hợp lệ đặt sai lệnh nói rõ cờ thuộc lệnh nào; giá trị sai định dạng in ví dụ và giá trị hợp lệ; id không tồn tại (check, criterion, risk, skill) liệt kê id hợp lệ và id gần nhất; --run-check nhắc khi có vẻ thiếu dấu --; mọi lệnh in lỗi cùng định dạng gồm dòng chữ và JSON { ok: false, error: { message, hint } }

## Required checks

- [x] `chk-breaker` (focused): Test breaker không bị né bằng skipped giả — pass (2026-10-25 19:31:35 +07:00)
- [x] `chk-flags` (focused): Test cờ không owner và --check lặp — pass (2026-10-25 19:31:42 +07:00)
- [x] `chk-status-learning` (focused): Test status --criteria và id learning — pass (2026-10-25 19:31:50 +07:00)
- [x] `chk-restore` (focused): Test restoreFullArtifacts lệch id — pass (2026-10-25 19:31:55 +07:00)
- [x] `chk-transaction` (focused): Test crash giữa file và manifest — pass (2026-10-25 19:32:00 +07:00)
- [x] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-25 19:34:29 +07:00)
- [x] `chk-breaker-digest` (focused): Test run-checks dùng digest hiện tại cho breaker — pass (2026-10-25 19:32:07 +07:00)
- [x] `chk-gates` (focused): Contract test, docs parity và golden — pass (2026-10-25 19:32:13 +07:00)
- [x] `chk-p3` (focused): Test ba lỗi P3: text-integrity và repo-map store — pass (2026-10-25 19:32:16 +07:00)
- [x] `chk-error-hints` (focused): Test dạng bảng: mỗi lệnh sai có hint trỏ đúng lệnh sửa — pass (2026-10-25 19:32:26 +07:00)

## Residual risks

- **r-lock-path** (medium) — Nghi vấn: workflow-lock băm đường dẫn chưa realpath và chưa hạ chữ thường trên Windows, nên D:\X và d:\x có thể không loại trừ nhau
- **r-dangling-link** (medium) — Nghi vấn: findRealExistingAncestor coi symlink/junction treo là không tồn tại; trên POSIX writeFile trực tiếp có thể đi theo link ra ngoài root
- **r-fsync** (low) — Nghi vấn: atomicWriteFile không fsync trước rename, mất điện có thể để lại task.json rỗng
- **r-plan-sync** (low) — Nghi vấn: đánh dấu checklist plan.md sau khi pass làm stale digest nếu plan.md là input của check, và đổi CRLF thành LF
- **r-launcher** (medium) — Nghi vấn: launcherFailure khớp chuỗi command not found ở bất kỳ đâu trong output, có thể coi một lần fail thật là lỗi khởi chạy và không ghi evidence
- **r-hook-cache** (low) — Nghi vấn: cache hook context theo sessionId không tiêm lại context Harnix sau khi agent compact trong cùng session
- **r-noop-flags** (low) — Cờ vô nghĩa bị nhận im lặng ở skill --suggest kèm tên skill, epic --limit với id, doctor --global không có --fix

## Evidence

- `chk-breaker` — pass (2026-10-25 19:31:35 +07:00): pnpm exec vitest run test/unit/core/workflow/completion.test.ts — exit 0
- `chk-flags` — pass (2026-10-25 19:31:42 +07:00): pnpm exec vitest run test/workflow/cli-contract.test.ts test/unit/commands/workflow-flag-owners.test.ts — exit 0
- `chk-status-learning` — pass (2026-10-25 19:31:50 +07:00): pnpm exec vitest run test/unit/commands/status.test.ts test/integration/commands/learning.test.ts — exit 0
- `chk-restore` — pass (2026-10-25 19:31:55 +07:00): pnpm exec vitest run test/unit/core/doctor/restore-artifacts.test.ts — exit 0
- `chk-transaction` — pass (2026-10-25 19:32:00 +07:00): pnpm exec vitest run test/unit/core/global — exit 0
- `chk-breaker-digest` — pass (2026-10-25 19:32:07 +07:00): pnpm exec vitest run test/unit/core/workflow/run-checks.test.ts — exit 0
- `chk-gates` — pass (2026-10-25 19:32:13 +07:00): pnpm test:gates — exit 0
- `chk-p3` — pass (2026-10-25 19:32:16 +07:00): pnpm exec vitest run test/unit/core/workflow/text-integrity.test.ts test/unit/core/repo-map/store.test.ts — exit 0
- `chk-error-hints` — pass (2026-10-25 19:32:26 +07:00): pnpm exec vitest run test/workflow/cli-contract.test.ts test/integration/commands/workflow-flags.test.ts test/integration/commands/status.test.ts test/integration/commands/skills.test.ts — exit 0
- `check-suite` — pass (2026-10-25 19:34:29 +07:00): pnpm test — exit 0
