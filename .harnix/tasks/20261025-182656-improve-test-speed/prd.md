# PRD: Tăng tốc toàn bộ test

## Context & Problem Statement

Baseline đo lúc bắt đầu task trên cùng máy: `vitest run` không coverage mất 123 giây cho 2.514 test (collect 180 giây CPU, prepare 80 giây CPU). Mỗi file test nạp lại toàn bộ đồ thị module vì Vitest cô lập module theo file. Các file "chậm" trong lần chạy đầy đủ (17–33 giây) chỉ mất 4–12 giây khi chạy riêng, nên phần lớn thời gian là tranh CPU, không phải từng test chậm. Riêng `version-sync.test.ts` spawn `pnpm exec prettier` ở mỗi lần gọi `syncVersion`.

Thử nghiệm `vitest run --no-isolate`: 2.514 test vẫn xanh, collect còn 51 giây, wall 82 giây (giảm 33%).

## Scope & Boundaries

Trong phạm vi: `isolate: false` trong `vitest.config.ts` (giữ `pool: "forks"` vì nhiều test dùng `process.chdir`), tiêm `format` giả vào các test version-sync không kiểm định dạng, tài liệu `test/README.md`. Ngoài phạm vi: xóa hay gộp test, hạ ngưỡng coverage, đổi lệnh gate `pnpm run test`.

## Anchored Acceptance Criteria

- ac-1: isolate false và version-sync không spawn prettier mỗi lần sync; mỗi file dưới 15 giây.
- ac-2: wall giảm ≥ 25% so với 123 giây, suite xanh ba lần liên tiếp (một lần xáo thứ tự).
- ac-3: số test, số assertion và ngưỡng coverage không giảm.
- ac-4: `test/README.md` ghi cách đo file chậm và lưu ý khi tắt cô lập module.

## Architectural & Safety Constraints

Tắt cô lập module làm các file trong một worker dùng chung trạng thái module: test phải tự khôi phục `process.cwd`, `process.exitCode` và mock (đã có `afterEach`). Chạy xáo thứ tự để phát hiện phụ thuộc thứ tự. Tuân thủ AGENTS.md.
