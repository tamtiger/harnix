# Đổi gate footprint sang ngân sách byte, sửa 3 lỗi nhỏ và khôi phục quy tắc bị mất khi rút gọn reference (2.22.2)

- **ID:** 20261026-070545-footprint-budget-and-doc-gaps
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-10-26 07:05:45 +07:00
- **Updated:** 2026-10-26 08:24:29 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 5/5 met or waived |
| Required checks | 100% | 9/9 passed |
| Residual risks | 1 | flaky-version-sync-fold-dev: low |

## Goal

Thay mốc footprint cố định 50% so với baseline Trellis (đo dung lượng đĩa của bản cài, không phải token) bằng ngân sách byte chỉ tăng có chủ đích, để thêm hướng dẫn vào skill không bị gate chặn một cách máy móc; đồng thời sửa các lỗi nhỏ và khoảng trống tài liệu mà review 2.22.1 tìm thấy.

## Non-goals

- Không đổi cách cài đặt references lên từng platform
- Không hạ ngưỡng coverage hay ngân sách token

## Relevant paths

- `docs/HARNIX_PRD.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/UPSTREAM_BASELINE.md`
- `scripts/measure-footprint.mjs`
- `src/skills/harnix-verify/references`
- `src/utils/suggest.ts`
- `test/unit/test-structure.test.ts`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +2 / -0 |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +3 / -1 |
| `docs/HARNIX_PRD.md` | modified | +2 / -2 |
| `docs/IMPLEMENTATION_PLAN.md` | modified | +3 / -3 |
| `docs/UPSTREAM_BASELINE.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `scripts/footprint-budget.json` | added | - |
| `scripts/footprint-budget.mjs` | added | - |
| `scripts/measure-footprint.mjs` | modified | +4 / -2 |
| `src/core/workflow/finish.ts` | modified | +1 / -1 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/references/epic.md` | modified | +3 / -3 |
| `src/skills/harnix-plan/references/replan.md` | modified | +1 / -1 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/references/agent-transport.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/references/cookbook-commands.md` | modified | +1 / -0 |
| `src/skills/harnix-verify/references/cookbook-notes.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/references/evidence.md` | modified | +3 / -2 |
| `src/skills/harnix-verify/references/gates.md` | modified | +2 / -2 |
| `src/skills/harnix-verify/references/task-state.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/references/workflow-routing.md` | modified | +1 / -1 |
| `src/utils/suggest.ts` | modified | +1 / -1 |
| `test/unit/test-structure.test.ts` | modified | +18 / -1 |
| `test/unit/utils/suggest.test.ts` | modified | +1 / -0 |
| `test/workflow/measure-footprint-guard.test.ts` | modified | +37 / -0 |
| `test/workflow/reference-rules.test.ts` | added | - |

## Acceptance criteria

- [x] `ac-1` (met): Gate measure:footprint đổi từ mốc cố định giảm 50% so với baseline Trellis sang ngân sách byte được lưu trong scripts/footprint-budget.json: thất bại khi footprint vượt ngân sách, vẫn in mức giảm so với baseline làm số tham khảo, và ngân sách chỉ đổi bằng một thay đổi có chủ đích trong file đó (như ngưỡng coverage, chỉ nâng khi có lý do ghi rõ)
- [x] `ac-2` (met): Tài liệu ghi quyết định đổi gate: HARNIX_PRD mục chấp nhận về footprint, IMPLEMENTATION_PLAN (mục measure:footprint và các mục chấp nhận), UPSTREAM_BASELINE mục 5, AGENTS.md; nêu rõ mốc 50% là số tham khảo lịch sử, gate hiện hành là ngân sách byte
- [x] `ac-3` (met): Guard test-structure bắt cả vi.mock lẫn vi.doMock; closestMatch so phần số bằng giá trị số nên ac-01 và ac-1 không bị coi là anh em khác số; JSDoc của finishWorkflowReport nằm đúng hàm
- [x] `ac-4` (met): Các quy tắc bị thu hẹp khi rút gọn reference được khôi phục bằng câu ngắn ở nơi agent đọc, và một test giữ danh sách cụm bắt buộc: --task áp dụng cho mọi lệnh edit và --inspect; --exit-code bắt buộc cho mọi kết quả pass hoặc fail; breaker có ba lối ra (input digest mới, --reset-breaker có --reason 10 đến 1000 ký tự, --replace-check) ở replan.md và HARNIX_PRD; chỉ một lần pass hợp lệ hoặc --reset-breaker mới reset breaker; evidence không được ghi ngày tương lai và --cwd khác bị từ chối; --run-checks trỏ đúng cookbook-commands; digest gắn task id và check id; --run-check và --evidence tự tick mục checklist; heredoc Bash gây unexpected EOF và PowerShell ANSI làm hỏng UTF-8 là lý do dùng --file; resume từ chối va chạm con trỏ; epic nhắc kiểm tra nhánh mong đợi và notice khi follow-up không có epic
- [x] `ac-5` (met): Phát hành bản vá 2.22.2: ngân sách footprint được đặt bằng số đo thực sau mọi thay đổi (đã gồm phần tăng do khôi phục quy tắc ở ac-4) làm tròn lên 1 KiB, mức tăng so với 2.22.1 được ghi thành decision và changelog, và toàn bộ gate phát hành xanh

## Required checks

- [x] `chk-footprint-gate` (focused): Test gate ngân sách footprint — pass (2026-10-26 08:19:11 +07:00)
- [x] `chk-small-fixes` (focused): Test guard vi.mock, closestMatch và finish — pass (2026-10-26 08:19:18 +07:00)
- [x] `chk-gates` (focused): Contract test, docs parity và golden — pass (2026-10-26 08:19:23 +07:00)
- [x] `chk-footprint` (focused): Footprint trong ngân sách — pass (2026-10-26 08:19:25 +07:00)
- [x] `check-suite` (full): Toàn bộ test kèm coverage của dự án phải xanh — pass (2026-10-26 08:22:59 +07:00)
- [x] `chk-rules` (focused): Test giữ các quy tắc bắt buộc của reference sau khi rút gọn — pass (2026-10-26 08:19:27 +07:00)
- [x] `chk-docs-decision` (focused): Contract test và docs parity sau khi ghi quyết định đổi gate — pass (2026-10-26 08:19:32 +07:00)
- [x] `chk-lint` (focused): Lint và format sạch — pass (2026-10-26 08:19:52 +07:00)
- [x] `chk-typecheck` (focused): Typecheck sạch — pass (2026-10-26 08:19:56 +07:00)

## Decisions

- **footprint-growth-from-ac4** — Footprint tăng so với 2.22.1 do khôi phục quy tắc ở ac-4 là có chủ đích; ngân sách đặt sau ac-4 và mức tăng được ghi ở changelog
  - _Why:_ Gate mới là ngân sách byte; mỗi KB reference tốn khoảng 4 KB footprint nên không thể khôi phục quy tắc mà giữ nguyên số byte
- **footprint-budget-set** — maxBytes khởi điểm 676864 (số đo 676754 làm tròn lên 1 KiB); footprint tăng khoảng 5 KB so với 2.22.1
  - _Why:_ Khôi phục quy tắc reference ghi ra bốn nơi; đúng ràng buộc PRD

## Residual risks

- **flaky-version-sync-fold-dev** (low) — Test version sync --fold-dev lỗi một lần khi chạy cả suite có coverage (pass khi chạy riêng và khi chạy lại); nghi do tải song song

## Evidence

- skipped (2026-10-26 07:09:09 +07:00): Task contract revised at persisted replan: Đối chiếu từng đoạn bị cắt ở 2.22.1 tìm thêm các chỗ mất ý ngoài danh sách của review, và cần một test để việc rút gọn không làm mất ý lần nữa
- skipped (2026-10-26 07:09:10 +07:00): Task contract revised at persisted replan: Test cụm bắt buộc cho ac-4
- skipped (2026-10-26 08:08:34 +07:00): Task contract revised at persisted replan: Review ready: chk-rules thiếu docs/**, slice chk-gates trùng id cho hai tiêu chí, check-suite không bao lint/typecheck và inputs hẹp, mâu thuẫn ràng buộc ngân sách với phần tăng do ac-4.
- `chk-footprint-gate` — pass (2026-10-26 08:19:11 +07:00): pnpm exec vitest run test/workflow/measure-footprint-guard.test.ts — exit 0
- `chk-small-fixes` — pass (2026-10-26 08:19:18 +07:00): pnpm exec vitest run test/unit/test-structure.test.ts test/unit/utils/suggest.test.ts test/unit/core/workflow/finish.test.ts — exit 0
- `chk-gates` — pass (2026-10-26 08:19:23 +07:00): pnpm test:gates — exit 0
- `chk-footprint` — pass (2026-10-26 08:19:25 +07:00): pnpm measure:footprint — exit 0
- `chk-rules` — pass (2026-10-26 08:19:27 +07:00): pnpm exec vitest run test/workflow/reference-rules.test.ts — exit 0
- `chk-docs-decision` — pass (2026-10-26 08:19:32 +07:00): pnpm test:gates — exit 0
- `chk-lint` — pass (2026-10-26 08:19:52 +07:00): pnpm lint — exit 0
- `chk-typecheck` — pass (2026-10-26 08:19:56 +07:00): pnpm typecheck — exit 0
- `check-suite` — pass (2026-10-26 08:22:59 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
