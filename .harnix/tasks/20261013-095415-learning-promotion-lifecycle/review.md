# Hoàn thiện vòng đời learning: review, approve, reject, promote vào spec

- **ID:** 20261013-095415-learning-promotion-lifecycle
- **Mode:** full
- **Epic:** 20261013-095411-harnix-learning-overhaul
- **Status:** completed/finishing
- **Created:** 2026-10-13 09:54:11 +07:00
- **Updated:** 2026-10-13 11:12:02 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 5/5 met or waived |
| Required checks | 100% | 3/3 passed |
| Residual risks | 4 | r-suite-intermittent: medium, r-store-cap: low, r-learned-concurrency: low, r-hook-cost: low |

## Goal

Thêm lệnh công khai (JSON mặc định) để xem hàng đợi, approve, reject và promote; promote dùng promotionProposal để sinh diff reviewable vào .harnix/spec/guides chỉ khi có approval tường minh; ghi status approved, promoted, rejected vào journal append-only; mở rộng kênh áp dụng theo kết quả research.

## Non-goals

- Không tự ghi spec khi chưa approval
- Không network, không global memory

## Relevant paths

- `docs`
- `src/cli-workflow-commands.ts`
- `src/commands`
- `src/core/context`
- `src/core/journal`
- `src/core/workflow`
- `src/templates/harnix`
- `test/unit/core/journal`

## Relevant specs

- `docs/HARNIX_WORKFLOW.md`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- [x] `ac-1` (met): Có đường end-to-end được test: learning từ draft hoặc candidate tới .harnix/spec/learned.md qua harnix learning --promote <id> --apply tường minh, và learned.md được nạp vào ngữ cảnh agent
- [x] `ac-2` (met): reject và promote ghi entry journal mới; trạng thái hiệu lực đúng trong mem --learning, harnix learning và preflight
- [x] `ac-3` (met): Cờ và action mới được cập nhật đủ cli-contract, golden, docs và template
- [x] `ac-4` (met): Hướng dẫn skill harnix-plan, workflow.md và docs mô tả đúng vòng đời mới (review, approve, reject, promote); doctor không thay đổi
- [x] `ac-5` (met): learned.md không làm tăng token vô hạn: nạp theo giao nhau relevantPaths trong trần 5 khối và 2000 ký tự, promote bị từ chối ở 40 khối, và lệnh retire gỡ khối kèm entry archived

## Required checks

- [x] `check-gates` (focused): Contract tests — pass (2026-10-13 11:09:42 +07:00)
- [x] `check-lifecycle` (focused): Test vòng đời learning — pass (2026-10-13 11:10:23 +07:00)
- [x] `check-suite-2` (full): Toàn bộ bộ test của dự án (bản thay thế) — pass (2026-10-13 11:11:33 +07:00)

## Decisions

- **d-scope-a** — Member A ưu tiên cao nhất: vòng đời promote vào guides cộng xếp hạng nạp theo giao nhau với relevantPaths (97/130 learning có task nguồn có relevantPaths).
  - _Why:_ Chỉ có đường áp dụng mới làm learning có hiệu lực; nạp theo độ liên quan không tăng token.

## Residual risks

- **r-suite-intermittent** (medium) — Một lần chạy check-suite bằng workflow --run-checks fail ở test workflow-flags 'records notes from flags' (finish báo thiếu checkpoint verifying/finishing) dù chạy tay cùng lệnh và qua cmd.exe đều pass 270 file; chưa tái hiện được, nghi test phụ thuộc thời gian hoặc I/O Windows
- **r-store-cap** (low) — readLearningStates chỉ đọc 500 entry mới nhất; sau đó một id promoted cũ có thể không tìm thấy nên --retire báo không tồn tại và capture có thể tạo lại draft
- **r-learned-concurrency** (low) — Ghi learned.md là đọc-sửa-ghi không có khóa; hai lệnh --promote --apply chạy đồng thời có thể mất một khối
- **r-hook-cost** (low) — Xếp hạng theo độ liên quan đọc task.json tuần tự cho mọi learning khi planning và learned.md chưa có giới hạn kích thước đọc

## Evidence

- skipped (2026-10-13 10:11:52 +07:00): Task contract revised at persisted replan: Người dùng chọn chỉ cần --apply, bỏ bước approve; bổ sung nạp learned.md vì không có đường nạp thì promote vô nghĩa
- skipped (2026-10-13 10:11:52 +07:00): Task contract revised at persisted replan: Bỏ approve theo yêu cầu người dùng, chỉ còn reject và promote --apply
- skipped (2026-10-13 10:16:24 +07:00): Task contract revised at persisted replan: Người dùng chỉ ra learned.md sẽ phình khi chạy nhiều task; cần chặn tăng token và có đường dọn
- skipped (2026-10-13 10:16:26 +07:00): Task contract revised at persisted replan: Thêm ac-5 vào check gates
- skipped (2026-10-13 10:16:33 +07:00): Task contract revised at persisted replan: Suite phải phủ cả ac-5 vừa thêm
- skipped (2026-10-13 10:20:10 +07:00): Task contract revised at persisted replan: Sửa cú pháp lệnh theo kiểu cờ, không dùng subcommand
- `check-lifecycle` — pass (2026-10-13 11:10:23 +07:00): pnpm exec vitest run test/unit test/integration — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
- `check-gates` — pass (2026-10-13 11:09:42 +07:00): pnpm test:gates — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
- `check-suite` — fail (2026-10-13 10:47:05 +07:00): pnpm test — exit 1 _(1 earlier rerun not shown; see task.json for full history)_
- skipped (2026-10-13 11:02:44 +07:00): Task contract revised at persisted replan: Người dùng cho phép thay check: lần fail thứ hai của check-suite không tái hiện được (270 file pass khi chạy tay và qua cmd.exe), thêm package.json vào inputs
- `check-suite-2` — pass (2026-10-13 11:11:33 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
