# Đổi gate footprint sang ngân sách byte, sửa 3 lỗi nhỏ và khôi phục quy tắc bị mất khi rút gọn reference (2.22.2)

- **ID:** 20261026-070545-footprint-budget-and-doc-gaps
- **Mode:** full
- **Status:** ready/ready
- **Created:** 2026-10-26 07:05:45 +07:00
- **Updated:** 2026-10-26 07:09:15 +07:00

**Verdict:** PENDING — 0/5 acceptance criteria met

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 0% | 0/5 met or waived |
| Required checks | 0% | 0/6 passed |

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

## Acceptance criteria

- [ ] `ac-1` (pending): Gate measure:footprint đổi từ mốc cố định giảm 50% so với baseline Trellis sang ngân sách byte được lưu trong scripts/footprint-budget.json: thất bại khi footprint vượt ngân sách, vẫn in mức giảm so với baseline làm số tham khảo, và ngân sách chỉ đổi bằng một thay đổi có chủ đích trong file đó (như ngưỡng coverage, chỉ nâng khi có lý do ghi rõ)
- [ ] `ac-2` (pending): Tài liệu ghi quyết định đổi gate: HARNIX_PRD mục chấp nhận về footprint, IMPLEMENTATION_PLAN (mục measure:footprint và các mục chấp nhận), UPSTREAM_BASELINE mục 5, AGENTS.md; nêu rõ mốc 50% là số tham khảo lịch sử, gate hiện hành là ngân sách byte
- [ ] `ac-3` (pending): Guard test-structure bắt cả vi.mock lẫn vi.doMock; closestMatch so phần số bằng giá trị số nên ac-01 và ac-1 không bị coi là anh em khác số; JSDoc của finishWorkflowReport nằm đúng hàm
- [ ] `ac-4` (pending): Các quy tắc bị thu hẹp khi rút gọn reference được khôi phục bằng câu ngắn ở nơi agent đọc, và một test giữ danh sách cụm bắt buộc: --task áp dụng cho mọi lệnh edit và --inspect; --exit-code bắt buộc cho mọi kết quả pass hoặc fail; breaker có ba lối ra (input digest mới, --reset-breaker có --reason 10 đến 1000 ký tự, --replace-check) ở replan.md và HARNIX_PRD; chỉ một lần pass hợp lệ hoặc --reset-breaker mới reset breaker; evidence không được ghi ngày tương lai và --cwd khác bị từ chối; --run-checks trỏ đúng cookbook-commands; digest gắn task id và check id; --run-check và --evidence tự tick mục checklist; heredoc Bash gây unexpected EOF và PowerShell ANSI làm hỏng UTF-8 là lý do dùng --file; resume từ chối va chạm con trỏ; epic nhắc kiểm tra nhánh mong đợi và notice khi follow-up không có epic
- [ ] `ac-5` (pending): Phát hành bản vá 2.22.2: ngân sách footprint được đặt bằng số đo thực sau thay đổi làm tròn lên 1 KiB và toàn bộ gate phát hành xanh

## Required checks

- [ ] `chk-footprint-gate` (focused): Test gate ngân sách footprint — chưa chạy / not yet run
- [ ] `chk-small-fixes` (focused): Test guard vi.mock, closestMatch và finish — chưa chạy / not yet run
- [ ] `chk-gates` (focused): Contract test, docs parity và golden — chưa chạy / not yet run
- [ ] `chk-footprint` (focused): Footprint trong ngân sách — chưa chạy / not yet run
- [ ] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — chưa chạy / not yet run
- [ ] `chk-rules` (focused): Test giữ các quy tắc bắt buộc của reference sau khi rút gọn — chưa chạy / not yet run

## Evidence

- skipped (2026-10-26 07:09:09 +07:00): Task contract revised at persisted replan: Đối chiếu từng đoạn bị cắt ở 2.22.1 tìm thêm các chỗ mất ý ngoài danh sách của review, và cần một test để việc rút gọn không làm mất ý lần nữa
- skipped (2026-10-26 07:09:10 +07:00): Task contract revised at persisted replan: Test cụm bắt buộc cho ac-4
