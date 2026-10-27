# Áp dụng chọn lọc ý tưởng từ hve-core vào skill harnix

- **ID:** 20261027-102937-hve-core-skill-improvements
- **Mode:** full
- **Status:** planning/planning
- **Created:** 2026-10-27 10:29:37 +07:00
- **Updated:** 2026-10-27 10:29:37 +07:00

**Verdict:** PENDING — 0/5 acceptance criteria met

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 0% | 0/5 met or waived |
| Required checks | 0% | 0/6 passed |

## Goal

Thêm vào skill harnix ba cải tiến chọn lọc từ microsoft/hve-core mà không làm phình ngân sách: plan critique theo lens trước ready cho task Full, quy tắc bốn nấc khi phát hiện điều mới lúc implement, và pass phản chứng cùng cổng kiểm chứng tri thức có sẵn khi research.

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- [ ] `ac-1` (pending): harnix-plan có reference plan-critique (harnix skill harnix-plan --reference plan-critique): bốn lens Coverage, Evidence, Executability, Risk (cộng Reconciliation khi replan), thang severity Critical/High/Medium/Low, critic chỉ trả ứng viên còn bên cha xác minh đoạn trích rồi mới ghi finding, tách Consistent khỏi Not assessed, không bắt buộc subagent, chạy tối đa một vòng và việc bỏ qua được ghi là skipped; SKILL.md chỉ thêm một dòng trỏ tới.
- [ ] `ac-2` (pending): harnix-implement có quy tắc bốn nấc cho điều mới phát hiện lúc implement (phán đoán cục bộ; ghi chú chỉ-triển-khai kể cả Guidance cho task sau; follow-up ngoài phạm vi qua --follow-up hoặc thành viên epic mới; replan khi đổi yêu cầu hoặc thiết kế) ánh xạ vào lệnh harnix workflow hiện có, đặt trong reference để SKILL.md giữ trong ngân sách.
- [ ] `ac-3` (pending): harnix-research thêm bước phản chứng (tìm ít nhất một nguồn hoặc phương án trong phạm vi có thể bác kết luận, ghi là ủng hộ, làm yếu, bác bỏ hay chưa giải quyết) và cổng tri thức có sẵn (context, artifact và memory được cung cấp là claim cần xác minh), nhất quán giữa profile standalone và task-scoped.
- [ ] `ac-4` (pending): Ngân sách giữ nguyên: instruction-budget, skill catalog và test:gates xanh, SKILL.md không vượt ngân sách token, measure:footprint trong maxBytes mà không nâng ngưỡng (nếu vượt thì gộp bớt trước; nâng chỉ khi có lý do ghi trong changelog).
- [ ] `ac-5` (pending): Tài liệu, template, skill và CHANGELOG đồng bộ; pnpm selfhost:sync chạy; một lần bump patch bằng pnpm version:sync; pnpm release:check xanh.

## Required checks

- [ ] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — chưa chạy / not yet run
- [ ] `chk-skills` (focused): Test catalog skill và ngân sách instruction — chưa chạy / not yet run
- [ ] `chk-gates` (focused): Contract tests (CLI, docs, golden, kiến trúc) — chưa chạy / not yet run
- [ ] `chk-footprint` (focused): Ngân sách footprint của setup — chưa chạy / not yet run
- [ ] `chk-release` (full): Chuỗi nghiệm thu release — chưa chạy / not yet run
- [ ] `chk-suite` (full): Toàn bộ test của dự án — chưa chạy / not yet run

## Evidence

_None recorded yet._
