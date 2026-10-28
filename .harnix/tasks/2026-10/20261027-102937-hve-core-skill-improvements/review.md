# Áp dụng chọn lọc ý tưởng từ hve-core vào skill harnix

- **ID:** 20261027-102937-hve-core-skill-improvements
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-10-27 10:29:37 +07:00
- **Updated:** 2026-10-28 13:30:21 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 10/10 met or waived |
| Required checks | 100% | 8/8 passed |

## Goal

Thêm vào skill harnix ba cải tiến chọn lọc từ microsoft/hve-core mà không làm phình ngân sách: plan critique theo lens trước ready cho task Full, quy tắc bốn nấc khi phát hiện điều mới lúc implement, và pass phản chứng cùng cổng kiểm chứng tri thức có sẵn khi research.

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -1 |
| `CHANGELOG.md` | modified | +6 / -0 |
| `NOTICE` | modified | +1 / -0 |
| `README.md` | modified | +1 / -1 |
| `docs/HARNIX_PRD.md` | modified | +1 / -1 |
| `docs/UPSTREAM_BASELINE.md` | modified | +13 / -1 |
| `docs/UPSTREAM_MAPPING.md` | modified | +13 / -0 |
| `package.json` | modified | +1 / -1 |
| `scripts/footprint-budget.json` | modified | +1 / -1 |
| `scripts/scan-release-assertions.mjs` | modified | +1 / -1 |
| `src/skills/catalog.ts` | modified | +6 / -1 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +5 / -10 |
| `src/skills/harnix-implement/references/discoveries.md` | added | - |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +4 / -4 |
| `src/skills/harnix-plan/references/plan-critique.md` | added | - |
| `src/skills/harnix-plan/references/ready-review.md` | modified | +4 / -1 |
| `src/skills/harnix-research/SKILL.md` | modified | +3 / -1 |
| `src/skills/harnix-review/SKILL.md` | modified | +3 / -1 |
| `src/skills/harnix-review/references/finding-triage.md` | added | - |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +2 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/references/gates.md` | modified | +3 / -3 |
| `test/integration/commands/skills.test.ts` | modified | +4 / -2 |
| `test/platform/codex-global.test.ts` | modified | +1 / -1 |
| `test/safety/release-scanner.test.ts` | modified | +2 / -0 |
| `test/unit/skills/catalog.test.ts` | modified | +12 / -3 |
| `test/workflow/docs-task-contract.test.ts` | modified | +2 / -2 |
| `test/workflow/provenance.test.ts` | modified | +13 / -0 |
| `test/workflow/reference-rules.test.ts` | modified | +61 / -0 |
| `test/workflow/skill-sources.test.ts` | modified | +11 / -0 |

## Acceptance criteria

- [x] `ac-1` (met): harnix-plan có reference plan-critique (harnix skill harnix-plan --reference plan-critique): bốn lens Coverage, Evidence, Executability, Risk (cộng Reconciliation khi replan), thang severity Critical/High/Medium/Low, critic chỉ trả ứng viên còn bên cha xác minh đoạn trích rồi mới ghi finding, tách Consistent khỏi Not assessed, không bắt buộc subagent, chạy tối đa một vòng và việc bỏ qua được ghi là skipped; SKILL.md chỉ thêm một dòng trỏ tới.
- [x] `ac-2` (met): harnix-implement có quy tắc bốn nấc cho điều mới phát hiện lúc implement (phán đoán cục bộ; ghi chú chỉ-triển-khai kể cả Guidance cho task sau; follow-up ngoài phạm vi qua --follow-up hoặc thành viên epic mới; replan khi đổi yêu cầu hoặc thiết kế) ánh xạ vào lệnh harnix workflow hiện có, đặt trong reference để SKILL.md giữ trong ngân sách.
- [x] `ac-3` (met): harnix-research thêm bước phản chứng (tìm ít nhất một nguồn hoặc phương án trong phạm vi có thể bác kết luận, ghi là ủng hộ, làm yếu, bác bỏ hay chưa giải quyết) và cổng tri thức có sẵn (context, artifact và memory được cung cấp là claim cần xác minh), nhất quán giữa profile standalone và task-scoped.
- [x] `ac-4` (met): Ngân sách được đo trước khi viết: chạy measure:footprint lấy số byte hiện có, gộp các reference mới vào reference sẵn có chừng nào hợp lý (critique, hội tụ và ready-review cùng nằm trong harnix-plan; finding-triage dùng chung cho hai skill). instruction-budget, skill catalog và test:gates xanh, SKILL.md không vượt ngân sách token (harnix-plan hiện sát 1.800 token nên ac-7 phải cắt trước khi thêm dòng trỏ). measure:footprint trong maxBytes; chỉ nâng maxBytes trong scripts/footprint-budget.json bằng đúng phần thiếu đã đo, kèm lý do trong CHANGELOG (người dùng đã cho phép ngày 2026-10-28).
- [x] `ac-5` (met): Tài liệu, template, skill và CHANGELOG đồng bộ; pnpm selfhost:sync chạy; một lần bump patch bằng pnpm version:sync; pnpm release:check xanh.
- [x] `ac-6` (met): NOTICE ghi microsoft/hve-core (MIT, Copyright (c) Microsoft Corporation) cùng các ý tưởng đã áp dụng; docs/UPSTREAM_BASELINE.md có dòng và mục nguồn với SHA và ngày truy cập, docs/UPSTREAM_MAPPING.md có bảng ánh xạ adapt cho ba cải tiến; test provenance khẳng định NOTICE chứa hve-core, và gói release vẫn mang NOTICE.
- [x] `ac-7` (met): Skill được phục vụ cho mọi dự án không chứa lệnh hay đường dẫn riêng của repo Harnix (pnpm run test:gates, pnpm selfhost:sync, pnpm version:sync, docs/HARNIX_*): một test quét văn bản skill và reference và fail khi gặp; khối 'In Harnix itself' và đoạn Release preparation của harnix-implement, cùng các câu tương ứng trong harnix-plan (dòng 38) và harnix-verify gates.md, được nói theo dạng chung ('test hợp đồng của dự án nếu có'). Phần riêng của repo này chuyển sang skill dự án mới .harnix/spec/skills/harnix-self-host (không được đóng gói nên không tốn footprint) và AGENTS.md mục 8 trỏ tới skill đó; token của harnix-implement và harnix-plan giảm.
- [x] `ac-8` (met): ready-review.md viết lại mục Criteria bằng lời riêng theo luật nguyên tử (một hành vi, một kết quả quan sát được từ bên ngoài, từ định lượng phải kèm ngưỡng, không nêu tên nội bộ, một chủ thể); giả định gắn nhãn validated, assumed hoặc unknown kèm tác động và giả định unknown tác động cao phải thành quyết định, check hoặc blocker trước ready (ghi trong prd.md, không thêm field schema); tóm tắt ready có mục 'Điều bạn có thể chưa biết' (ghi None nếu không có).
- [x] `ac-9` (met): Quy tắc hội tụ cho critique và replan trong harnix-plan: ưu tiên sửa bằng cách đơn giản hóa; nếu phần lớn finding mới nằm ở đoạn vừa thêm ở vòng sửa trước thì dừng, chỉ sửa mức Critical/High và ghi phần còn lại thành residualRisk; sửa chữa bị đảo ngược hoặc finding dao động thì dừng và báo hành động cần để gỡ; thành viên epic chỉ chạy lại critique khi thành viên trước đổi file, hợp đồng hoặc check của nó.
- [x] `ac-10` (met): harnix-security-lens và harnix-review có reference finding-triage: bước bác bỏ từng finding (đầu vào đã được validate ở phía trên luồng, có guard xác thực hoặc phân quyền, mặc định an toàn của framework, đường chết hoặc chỉ dùng cho test, kiểm soát bù trừ) với phán quyết CONFIRMED, DISPROVED hoặc DOWNGRADED; mỗi finding có một đích xử lý (lỗi quay lại implement, thiếu quyết định thì replan, thiếu bằng chứng thì research hoặc chạy check, việc không chặn thì follow-up hoặc risk); yêu cầu không có bằng chứng dẫn ra ghi Not assessed tách khỏi Pass; không bắt buộc subagent.

## Required checks

- [x] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-28 13:15:21 +07:00)
- [x] `chk-skills` (focused): Test catalog skill và ngân sách instruction — pass (2026-10-28 11:44:01 +07:00)
- [x] `chk-gates` (focused): Contract tests (CLI, docs, golden, kiến trúc) — pass (2026-10-28 11:44:13 +07:00)
- [x] `chk-footprint` (focused): Ngân sách footprint của setup — pass (2026-10-28 11:44:16 +07:00)
- [x] `chk-release` (full): Chuỗi nghiệm thu release — pass (2026-10-28 11:43:48 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án — pass (2026-10-28 11:38:04 +07:00)
- [x] `chk-notice` (focused): Test provenance và NOTICE — pass (2026-10-28 11:44:07 +07:00)
- [x] `chk-served` (focused): Test skill phục vụ và quy tắc reference — pass (2026-10-28 11:44:04 +07:00)

## Decisions

- **d-footprint** — Cho phép nâng maxBytes của footprint khi cần thiết, sau khi đo và gộp reference.
  - _Why:_ Người dùng cho phép ngày 2026-10-28; headroom hiện chỉ khoảng 940 byte, mỗi byte skill nhân theo số nền tảng. Nâng chỉ bằng phần thiếu đã đo và ghi lý do trong CHANGELOG.
- **d-order** — Làm ac-7 trước, phiên bản dự kiến 2.23.3.
  - _Why:_ ac-7 cắt token của harnix-plan (sát 1.800) và harnix-implement trước khi thêm dòng trỏ; 2.23.2 đã dùng cho task sửa archive.

## Evidence

- `chk-skills` — pass (2026-10-28 11:44:01 +07:00): pnpm exec vitest run test/unit/skills test/workflow/instruction-budget.test.ts — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
- `chk-served` — pass (2026-10-28 11:44:04 +07:00): pnpm exec vitest run test/workflow/skill-sources.test.ts test/workflow/reference-rules.test.ts — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
- `chk-notice` — pass (2026-10-28 11:44:07 +07:00): pnpm exec vitest run test/workflow/provenance.test.ts test/safety/release-scanner.test.ts — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
- `chk-gates` — pass (2026-10-28 11:44:13 +07:00): pnpm test:gates — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
- `chk-footprint` — pass (2026-10-28 11:44:16 +07:00): pnpm measure:footprint — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-28 13:15:21 +07:00): pnpm test — exit 0 _(4 earlier reruns not shown; see task.json for full history)_
- `chk-suite` — pass (2026-10-28 11:38:04 +07:00): pnpm test — exit 0
- `chk-release` — pass (2026-10-28 11:43:48 +07:00): pnpm release:check — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
