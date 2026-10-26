# Plan: Ngân sách footprint, lỗi nhỏ và khôi phục quy tắc (2.22.2)

## Execution Slices

- [ ] [chk-footprint-gate] ac-1: `scripts/footprint-budget.json` (`{ "maxBytes": <số> }`); `measure-footprint.mjs` đọc ngân sách, thất bại khi footprint vượt, vẫn in `reduction` so với baseline như số tham khảo; hàm kiểm tra tách ra để test không cần build
- [ ] [chk-small-fixes] ac-3: guard `vi.mock`/`vi.doMock` trong `test-structure`; `onlyNumberDiffers` so bằng `Number`; JSDoc `finishWorkflowReport`
- [ ] [chk-rules] ac-4: viết `test/workflow/reference-rules.test.ts` giữ danh sách cụm bắt buộc (mỗi quy tắc phải còn ở sheet hoặc reference mà agent đọc), thấy đỏ rồi khôi phục bằng câu ngắn ở `epic.md` (mục 5, mục 7, git awareness), `cookbook-notes.md` (`--exit-code`, heredoc và ANSI), `cookbook-commands.md` (`--reset-breaker` 10 đến 1000 ký tự), `replan.md`, `HARNIX_PRD.md`, `evidence.md` (reset breaker, ngày tương lai, `--cwd`), `agent-transport.md` (pointer `--run-checks`), `gates.md` (digest task id và check id, tick tự động), `workflow-routing.md` (resume từ chối va chạm), `task-state.md` (review learning)
- [ ] [chk-gates] ac-4: rà tài liệu docs khớp sau khi khôi phục
- [ ] [chk-gates] ac-2: ghi quyết định đổi gate ở `HARNIX_PRD.md`, `IMPLEMENTATION_PLAN.md`, `UPSTREAM_BASELINE.md` mục 5, AGENTS.md
- [ ] [chk-footprint] ac-5: đo footprint sau các thay đổi, đặt `maxBytes` bằng số đo làm tròn lên 1 KiB
- [ ] [check-suite] lint, typecheck, toàn bộ test và gate phát hành; `pnpm version:sync 2.22.2 --kind fixed`

## Guardrails & Invariants

- Test hồi quy viết trước, thấy đỏ rồi mới sửa.
- Ngân sách ban đầu không nới hơn số đo thực quá 1 KiB; không hạ ngưỡng coverage hay ngân sách token.

## Verification Matrix

| Criterion | Check |
| --- | --- |
| ac-1 | chk-footprint-gate |
| ac-2 | chk-gates |
| ac-4 | chk-rules, chk-gates |
| ac-3 | chk-small-fixes |
| ac-5 | chk-footprint |
| tất cả | check-suite |
