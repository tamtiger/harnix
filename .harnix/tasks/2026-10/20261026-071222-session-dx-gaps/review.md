# Gỡ các ma sát gặp khi phát triển harnix: file runtime bị commit, lint file nháp, thêm member không đổi con trỏ, sửa không đổi, output gọn và release:check (2.22.3)

- **ID:** 20261026-071222-session-dx-gaps
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-10-26 07:12:22 +07:00
- **Updated:** 2026-10-26 08:51:55 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 10/10 met or waived |
| Required checks | 100% | 10/10 passed |
| Residual risks | 1 | flaky-version-sync-eperm: low |

## Goal

Sửa các vấn đề thực tế gặp khi dùng chính harnix để phát triển harnix trong phiên review 2.22.x, để agent đỡ phải chạy script phụ, đọc task.json hay pause rồi resume chỉ để thêm một task.

## Non-goals

- Không đổi field hay enum đóng băng của TaskRecord
- Không đổi cách phát hành hay ngân sách footprint (task 2.22.2 lo)
- Không tự promote hay reject learning

## Relevant paths

- `.gitignore`
- `eslint.config.mjs`
- `package.json`
- `scripts`
- `src/commands/status.ts`
- `src/core/doctor`
- `src/core/journal/learning-notes.ts`
- `src/core/workflow/init-task.ts`
- `src/core/workflow/transition.ts`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `.gitignore` | modified | +2 / -0 |
| `AGENTS.md` | modified | +6 / -1 |
| `CHANGELOG.md` | modified | +12 / -0 |
| `README.md` | modified | +6 / -1 |
| `docs/HARNIX_PRD.md` | modified | +3 / -3 |
| `docs/HARNIX_WORKFLOW.md` | modified | +2 / -2 |
| `docs/IMPLEMENTATION_PLAN.md` | modified | +6 / -4 |
| `docs/UPSTREAM_BASELINE.md` | modified | +1 / -1 |
| `eslint.config.mjs` | modified | +10 / -1 |
| `package.json` | modified | +3 / -2 |
| `scripts/footprint-budget.json` | added | - |
| `scripts/footprint-budget.mjs` | added | - |
| `scripts/measure-footprint.mjs` | modified | +4 / -2 |
| `scripts/release-check.mjs` | added | - |
| `src/cli-workflow-commands.ts` | modified | +19 / -24 |
| `src/commands/status-mode.ts` | added | - |
| `src/commands/status.ts` | modified | +41 / -0 |
| `src/commands/workflow-command.ts` | modified | +2 / -0 |
| `src/commands/workflow-flag-owners.ts` | modified | +2 / -0 |
| `src/commands/workflow-flags.ts` | modified | +2 / -0 |
| `src/commands/workflow-handlers.ts` | modified | +1 / -0 |
| `src/commands/workflow-lifecycle-handlers.ts` | modified | +1 / -0 |
| `src/core/doctor/project-runtime.ts` | added | - |
| `src/core/doctor/project.ts` | modified | +3 / -0 |
| `src/core/journal/learning-notes.ts` | modified | +6 / -1 |
| `src/core/workflow/envelope.ts` | modified | +10 / -0 |
| `src/core/workflow/finish.ts` | modified | +1 / -1 |
| `src/core/workflow/init-task.ts` | modified | +7 / -1 |
| `src/core/workflow/plan-edit.ts` | modified | +28 / -2 |
| `src/core/workflow/save.ts` | modified | +11 / -4 |
| `src/core/workflow/schema.ts` | modified | +2 / -2 |
| `src/core/workflow/set-criterion.ts` | modified | +7 / -2 |
| `src/core/workflow/transition.ts` | modified | +8 / -3 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/references/epic.md` | modified | +3 / -3 |
| `src/skills/harnix-plan/references/ready-review.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/references/replan.md` | modified | +1 / -1 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/references/agent-transport.md` | modified | +1 / -1 |

_(26 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): File runtime của harnix không còn bị commit: .harnix/tasks/.active (con trỏ theo từng người), .harnix/tmp/ (file nháp) và .harnix/cache/ (đã nằm trong .gitignore nhưng repo-map-v1.json vẫn bị track) được ignore trong repo này và gỡ khỏi index bằng git rm --cached (không xóa file); harnix doctor cảnh báo active-pointer-tracked khi .active đang được git track, dùng process runner được tiêm
- [x] `ac-2` (met): ESLint bỏ qua .harnix/** (Prettier đã bỏ qua .harnix trong .prettierignore, test hợp đồng cấu hình giữ cả hai), nên file nháp đặt trong .harnix/tmp/ (được CLAUDE.md và AGENTS.md cho phép) không làm pnpm lint thất bại
- [x] `ac-3` (met): workflow --init nhận --no-activate cùng --epic hoặc đứng riêng: tạo task ở planning mà không đổi con trỏ .active của task đang làm, để thêm member vào epic hiện có hoặc tạo task tiếp nối mà không phải pause rồi resume
- [x] `ac-4` (met): Sửa nghĩa không đổi (--set-check, --set-criterion, --add-criterion lặp lại đúng giá trị hiện có) không còn báo lỗi contractRevision khó hiểu: lệnh trả thành công với thông báo không có gì thay đổi và không đưa task về replan
- [x] `ac-5` (met): workflow --transition <s>/<c> --dry-run trả gọn { valid, issues, advisories } theo mặc định; reviewChecklist chỉ in khi thêm --checklist, khi có lỗi, hoặc khi đích là ready/ready của task Full (để ready-review của Full vẫn thấy checklist trước --reviewed); workflow.md và skill harnix-plan nêu rõ quy tắc này
- [x] `ac-6` (met): status --checks in danh sách gọn các check của task active gồm id, scope, required, criterionIds, command và trạng thái tươi, để agent không phải đọc task.json
- [x] `ac-7` (met): Decision có id bắt đầu bằng trace- ghi vết đo đạc hoặc quy trình và không bao giờ được --finish chụp thành learning; schema TaskRecord giữ nguyên
- [x] `ac-8` (met): Một lệnh pnpm release:check chạy đúng chuỗi gate phát hành của IMPLEMENTATION_PLAN mục 11 (install --frozen-lockfile, build, lint, typecheck, test, pack:check, smoke:tarball, measure:init, measure:footprint, scan:release, git diff --check), in từng lệnh với exit code và thời gian, dừng ở lệnh đầu tiên lỗi; được ghi ở IMPLEMENTATION_PLAN mục 11, danh sách Required package scripts của AGENTS.md và test/workflow/package-contract.test.ts
- [x] `ac-9` (met): Gửi nhầm kết quả của workflow --inspect (có activeTask và contextDrift) làm task trong --save nhận thông báo nói rõ cần truyền đối tượng activeTask, thay cho Invalid or unsupported task record
- [x] `ac-10` (met): Tài liệu đồng bộ với các thay đổi trên (AGENTS.md, README, HARNIX_WORKFLOW, HARNIX_PRD, IMPLEMENTATION_PLAN, workflow.md và selfhost, skill references); sau khi thêm hướng dẫn, pnpm measure:footprint vẫn xanh: nếu vượt thì nâng maxBytes trong scripts/footprint-budget.json bằng số đo thực làm tròn lên 1 KiB kèm lý do ở changelog; bản vá 2.22.3 (kind added hoặc changed, không phải fixed) phát hành với toàn bộ gate xanh

## Required checks

- [x] `chk-runtime-files` (focused): Ignore file runtime và cảnh báo doctor — pass (2026-10-26 08:41:30 +07:00)
- [x] `chk-no-activate` (focused): init --no-activate giữ con trỏ — pass (2026-10-26 08:41:38 +07:00)
- [x] `chk-noop-edit` (focused): Sửa không đổi và lỗi inspect — pass (2026-10-26 08:41:47 +07:00)
- [x] `chk-lean-output` (focused): dry-run gọn, status --checks và trace- — pass (2026-10-26 08:41:55 +07:00)
- [x] `chk-release-check` (focused): Script release:check — pass (2026-10-26 08:41:57 +07:00)
- [x] `chk-gates` (focused): Contract test, docs parity và golden — pass (2026-10-26 08:42:03 +07:00)
- [x] `check-suite` (full): Toàn bộ test kèm coverage của dự án phải xanh — pass (2026-10-26 08:43:42 +07:00)
- [x] `chk-lint` (focused): Lint và format sạch (gồm ignore .harnix/**) — pass (2026-10-26 08:42:21 +07:00)
- [x] `chk-typecheck` (focused): Typecheck sạch — pass (2026-10-26 08:42:26 +07:00)
- [x] `chk-footprint` (focused): Footprint trong ngân sách sau khi thêm hướng dẫn — pass (2026-10-26 08:42:28 +07:00)

## Decisions

- **order-after-footprint-task** — Task này làm sau task 20261026-070545-footprint-budget-and-doc-gaps (2.22.2); không có epic hay followUpOf vì chỉ đặt được lúc --init
  - _Why:_ Hai task cùng sửa tài liệu và package.json, và ngân sách footprint của task kia phải có trước để ac-10 nâng maxBytes có chủ đích

## Residual risks

- **flaky-version-sync-eperm** (low) — Test version sync --fold-dev thỉnh thoảng lỗi EPERM trên Windows khi chạy cả suite có coverage (lần chạy lại pass); chưa tìm nguyên nhân gốc

## Evidence

- skipped (2026-10-26 08:09:38 +07:00): Task contract revised at persisted replan: Review ready: làm rõ ac-1/2/5/8/10 (cache bị track, Prettier đã ignore, giữ checklist ở ready-review, package-contract, footprint và loại changelog) và bổ sung check lint, typecheck, footprint; mở rộng inputs của check-suite.
- `chk-runtime-files` — pass (2026-10-26 08:41:30 +07:00): pnpm exec vitest run test/unit/core/doctor test/workflow/runtime-files.test.ts — exit 0
- `chk-no-activate` — pass (2026-10-26 08:41:38 +07:00): pnpm exec vitest run test/unit/core/workflow/init-task.test.ts test/integration/commands/workflow-flags.test.ts — exit 0
- `chk-noop-edit` — pass (2026-10-26 08:41:47 +07:00): pnpm exec vitest run test/unit/core/workflow/plan-edit.test.ts test/unit/core/workflow/envelope.test.ts — exit 0
- `chk-lean-output` — pass (2026-10-26 08:41:55 +07:00): pnpm exec vitest run test/unit/core/workflow/transition.test.ts test/unit/commands/status.test.ts test/unit/core/journal — exit 0
- `chk-release-check` — pass (2026-10-26 08:41:57 +07:00): pnpm exec vitest run test/workflow/release-check.test.ts — exit 0
- `chk-gates` — pass (2026-10-26 08:42:03 +07:00): pnpm test:gates — exit 0
- `chk-lint` — pass (2026-10-26 08:42:21 +07:00): pnpm lint — exit 0
- `chk-typecheck` — pass (2026-10-26 08:42:26 +07:00): pnpm typecheck — exit 0
- `chk-footprint` — pass (2026-10-26 08:42:28 +07:00): pnpm measure:footprint — exit 0
- `check-suite` — pass (2026-10-26 08:43:42 +07:00): pnpm test — exit 0
