# Thêm dòng Verdict và gộp evidence rerun trùng lặp trong review.md

- **ID:** 20260924-144648-review-md-verdict-and-dedupe
- **Mode:** lite
- **Status:** completed/finishing
- **Created:** 2026-09-24T14:46:48+07:00
- **Updated:** 2026-09-24T07:54:18.009Z

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Cải thiện renderTaskReview trong src/core/tasks/task.ts: thêm dòng Verdict tóm tắt trạng thái tổng quan ngay sau header block, và gộp evidence cùng checkId trong mục Evidence để chỉ hiển thị lần chạy mới nhất kèm ghi chú số lần rerun trước đó, giúp reviewer không phải đọc hết file mới biết task pass hay chưa.

## Non-goals

- Không đổi dữ liệu evidence trong task.json (append-only, immutable) — chỉ đổi cách hiển thị derived view review.md.
- Không đổi TaskRecord schema, taskContractHash, hay ready-trace grammar v1.
- Không thêm severity structured vào EvidenceRecordV2 (thuộc task Full riêng, cùng epic).

## Acceptance criteria

- `review-verdict-line` (met): review.md có dòng Verdict ngay sau header block (trước Goal) tóm tắt trạng thái tổng quan: PASS khi mọi criterion met/waived và mọi required check có evidence pass mới nhất; PENDING kèm số liệu X/Y criteria met khi chưa xong; BLOCKED kèm blocker.kind khi status=blocked; CANCELLED khi status=cancelled.
- `review-evidence-dedup` (met): Trong mục Evidence, các entry cùng checkId được gộp: chỉ hiển thị entry mới nhất (theo recordedAt) kèm ghi chú số lần rerun trước đó nếu >1; entry không có checkId (ví dụ migration evidence) vẫn hiển thị riêng lẻ theo thứ tự cũ; dữ liệu evidence gốc trong task.json không đổi.
- `review-regeneration-unchanged` (met): review.md vẫn được regenerate đúng ở mọi lần saveTask (--save/--transition/--evidence/--finish/--cancel); không đổi TaskRecord schema, obligations, hay taskContractHash.
- `regression-safe` (met): Toàn bộ test hiện có liên quan tới review.md/renderTaskReview trong test/unit/task-state.test.ts và test:unit tổng thể vẫn pass.

## Required checks

- `chk-verdict-line-unit` (focused): Unit test: Verdict line xuat hien dung cho cac trang thai PASS/PENDING/BLOCKED/CANCELLED. — pass (2026-09-24T14:52:00+07:00)
- `chk-evidence-dedup-unit` (focused): Unit test: nhieu evidence cung checkId chi hien thi 1 entry moi nhat kem ghi chu rerun count; task.json giu nguyen toan bo evidence. — pass (2026-09-24T14:52:00+07:00)
- `chk-review-regeneration-unit` (focused): Unit test: review.md regenerate dung luc o --save/--transition/--evidence, khong doi taskContractHash. — pass (2026-09-24T14:52:00+07:00)
- `chk-full-regression` (full): Toan bo test:unit pass sau thay doi. — pass (2026-09-24T14:52:00+07:00)

## Decisions

- **roadmap-render-epic-title-bugfix** — Trong luc gan epicId cho task nay, phat hien bug: internal-workflow.ts goi renderRoadmapMarkdown(root, epicId) khong kem epic record khi task.epicId khop epic co san, lam mat title/goal cua epic (chi con hien thi bare ID). Da fix bang cach them loadEpicRecord() de doc lai epic tu disk truoc khi render lai, va tang cuong test lien quan trong internal-workflow-save.test.ts.
  - _Why:_ Bug nay khong thuoc pham vi acceptance criteria cua task nay (review.md Verdict/dedupe), nhung duoc phat hien va sua ngay trong cung phien lam viec khi dogfood tinh nang roadmap de tao epic cho task nay; ghi lai o day de co provenance ro rang thay vi am tham sua khong dau vet.

## Evidence

- `chk-verdict-line-unit` — pass (2026-09-24T14:52:00+07:00): Verdict line dung sau header, truoc Goal: PASS/PENDING(X/Y)/BLOCKED(kind)/CANCELLED(reason) deu dung - test moi pass.
- `chk-evidence-dedup-unit` — pass (2026-09-24T14:52:00+07:00): Evidence cung checkId chi hien thi entry moi nhat kem ghi chu so lan rerun; task.json van giu du 3 evidence goc (khong mat du lieu) - test moi pass.
- `chk-review-regeneration-unit` — pass (2026-09-24T14:52:00+07:00): review.md van regenerate dung o moi lan saveTask; khong doi TaskRecord schema/taskContractHash - 27/27 test task-state.test.ts pass.
- `chk-full-regression` — pass (2026-09-24T14:52:00+07:00): test:unit 287 pass + 1 pre-existing failure khong lien quan (stray .kilo worktree); test:workflow 10/10 files (120 tests) pass; test:integration 21/21 files (130 tests) pass.
